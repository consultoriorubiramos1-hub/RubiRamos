from pathlib import Path

import joblib
import pandas as pd


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "modelo_inasistencia.joblib"


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el modelo en: {MODEL_PATH}"
        )

    package = joblib.load(MODEL_PATH)

    model = package["model"]
    feature_columns = package["feature_columns"]

    # Ejemplo de una cita con riesgo:
    # - No pagó anticipo.
    # - Tiene una inasistencia anterior.
    # - Su porcentaje previo de asistencia es bajo.
    appointment_data = {
        "age": 35,
        "gender_female": 0,
        "deposit_paid": 0,
        "deposit_amount": 100,
        "day_of_week": 5,
        "appointment_hour": 17,
        "is_saturday": 0,
        "previous_completed": 2,
        "previous_no_show": 1,
        "previous_cancelled": 0,
        "previous_appointments": 3,
        "previous_attendance_rate": 0.6667,
    }

    features = pd.DataFrame(
        [appointment_data],
        columns=feature_columns,
    )

    no_show_probability = float(
        model.predict_proba(features)[0][1]
    )

    predicted_no_show = int(
        model.predict(features)[0]
    )

    attendance_probability = (
        1 - no_show_probability
    )

    if no_show_probability >= 0.70:
        risk_level = "Alto"
    elif no_show_probability >= 0.40:
        risk_level = "Medio"
    else:
        risk_level = "Bajo"

    print("=" * 55)
    print("PREDICCIÓN DE ASISTENCIA")
    print("=" * 55)
    print(
        f"Probabilidad de inasistencia: "
        f"{no_show_probability * 100:.2f}%"
    )
    print(
        f"Probabilidad de asistencia: "
        f"{attendance_probability * 100:.2f}%"
    )
    print(f"Nivel de riesgo: {risk_level}")
    print(
        "Predicción:",
        "No asistirá"
        if predicted_no_show == 1
        else "Sí asistirá",
    )
    print("=" * 55)


if __name__ == "__main__":
    main()