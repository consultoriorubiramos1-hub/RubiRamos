from __future__ import annotations

from pathlib import Path
from typing import Any, Literal

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================
# RUTAS Y MODELO
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "modelo_inasistencia.joblib"


if not MODEL_PATH.exists():
    raise FileNotFoundError(
        f"No se encontró el modelo en: {MODEL_PATH}"
    )


model_package: dict[str, Any] = joblib.load(
    MODEL_PATH
)

model = model_package["model"]

feature_columns: list[str] = model_package[
    "feature_columns"
]


# ============================================================
# APLICACIÓN FASTAPI
# ============================================================

app = FastAPI(
    title="API de predicción de asistencia",
    description=(
        "Predice el riesgo de inasistencia de un paciente "
        "a una cita nutricional."
    ),
    version="1.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODELOS DE ENTRADA Y SALIDA
# ============================================================

class AppointmentPredictionInput(BaseModel):
    age: int = Field(
        ge=0,
        le=120,
    )

    gender_female: int = Field(
        ge=0,
        le=1,
    )

    # Se conservan por compatibilidad con Next.js,
    # pero el modelo actual no utiliza el anticipo.
    deposit_paid: int = Field(
        default=0,
        ge=0,
        le=1,
    )

    deposit_amount: float = Field(
        default=0,
        ge=0,
    )

    day_of_week: int = Field(
        ge=1,
        le=7,
    )

    appointment_hour: int = Field(
        ge=0,
        le=23,
    )

    is_saturday: int = Field(
        ge=0,
        le=1,
    )

    previous_completed: int = Field(
        ge=0,
    )

    previous_no_show: int = Field(
        ge=0,
    )

    previous_cancelled: int = Field(
        ge=0,
    )

    previous_appointments: int = Field(
        ge=0,
    )

    previous_attendance_rate: float = Field(
        ge=0,
        le=1,
    )


class AppointmentPredictionOutput(BaseModel):
    no_show_probability: float
    attendance_probability: float
    no_show_percentage: float
    attendance_percentage: float
    risk_level: Literal[
        "Bajo",
        "Medio",
        "Alto",
    ]
    predicted_no_show: int
    prediction: str


# ============================================================
# ENDPOINTS GENERALES
# ============================================================

@app.get("/")
def root():
    return {
        "service": "Predicción de asistencia",
        "status": "online",
        "model": model_package.get(
            "model_name",
            "modelo_desconocido",
        ),
        "version": "1.1.0",
    }


@app.get("/health")
def health():
    return {
        "success": True,
        "model_loaded": True,
        "model_name": model_package.get(
            "model_name",
            "modelo_desconocido",
        ),
        "feature_columns": feature_columns,
    }


# ============================================================
# PREDICCIÓN
# ============================================================

@app.post(
    "/predict",
    response_model=AppointmentPredictionOutput,
)
def predict_attendance(
    input_data: AppointmentPredictionInput,
):
    try:
        values = input_data.model_dump()

        # Recalcular las variables históricas para garantizar
        # que sean consistentes entre sí.
        previous_completed = int(
            input_data.previous_completed
        )

        previous_no_show = int(
            input_data.previous_no_show
        )

        previous_cancelled = int(
            input_data.previous_cancelled
        )

        previous_appointments = (
            previous_completed
            + previous_no_show
            + previous_cancelled
        )

        previous_attendance_total = (
            previous_completed
            + previous_no_show
        )

        previous_attendance_rate = (
            previous_completed
            / previous_attendance_total
            if previous_attendance_total > 0
            else 0.0
        )

        values.update(
            {
                "previous_completed":
                    previous_completed,

                "previous_no_show":
                    previous_no_show,

                "previous_cancelled":
                    previous_cancelled,

                "previous_appointments":
                    previous_appointments,

                "previous_attendance_rate":
                    previous_attendance_rate,
            }
        )

        # Solamente se toman las columnas que utiliza
        # el modelo guardado. El anticipo queda excluido
        # porque ya no forma parte de feature_columns.
        features = pd.DataFrame(
            [values],
            columns=feature_columns,
        )

        probabilities = model.predict_proba(
            features
        )[0]

        model_classes = list(
            model.classes_
        )

        if 1 not in model_classes:
            raise RuntimeError(
                "El modelo no contiene la clase de inasistencia."
            )

        no_show_class_index = (
            model_classes.index(1)
        )

        # Probabilidad calculada únicamente por el modelo.
        model_no_show_probability = float(
            probabilities[
                no_show_class_index
            ]
        )

        # Probabilidad basada en el historial real.
        #
        # Se utiliza solo cuando existen al menos tres citas
        # anteriores atendidas o no atendidas. De esta forma,
        # una sola falta inicial no domina la predicción.
        historical_no_show_probability = (
            previous_no_show
            / previous_attendance_total
            if previous_attendance_total >= 3
            else 0.0
        )

        # Se toma la probabilidad mayor para evitar que el
        # modelo ignore un historial importante de faltas.
        no_show_probability = max(
            model_no_show_probability,
            historical_no_show_probability,
        )

        no_show_probability = min(
            max(no_show_probability, 0.0),
            1.0,
        )

        attendance_probability = (
            1.0 - no_show_probability
        )

        # Clasificación final.
        predicted_no_show = int(
            no_show_probability >= 0.50
        )

        if no_show_probability >= 0.50:
            risk_level: Literal[
                "Bajo",
                "Medio",
                "Alto",
            ] = "Alto"

        elif no_show_probability >= 0.25:
            risk_level = "Medio"

        else:
            risk_level = "Bajo"

        prediction = (
            "No asistirá"
            if predicted_no_show == 1
            else "Sí asistirá"
        )

        print(
            "Predicción generada:",
            {
                "model_probability": round(
                    model_no_show_probability,
                    4,
                ),
                "historical_probability": round(
                    historical_no_show_probability,
                    4,
                ),
                "final_probability": round(
                    no_show_probability,
                    4,
                ),
                "risk_level": risk_level,
            },
        )

        return AppointmentPredictionOutput(
            no_show_probability=round(
                no_show_probability,
                6,
            ),

            attendance_probability=round(
                attendance_probability,
                6,
            ),

            no_show_percentage=round(
                no_show_probability * 100,
                2,
            ),

            attendance_percentage=round(
                attendance_probability * 100,
                2,
            ),

            risk_level=risk_level,

            predicted_no_show=(
                predicted_no_show
            ),

            prediction=prediction,
        )

    except Exception as error:
        print(
            "Error al generar la predicción:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "No se pudo generar la predicción "
                "de asistencia."
            ),
        ) from error