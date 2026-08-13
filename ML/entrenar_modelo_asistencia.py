from __future__ import annotations

import json
from pathlib import Path

import joblib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    precision_recall_fscore_support,
    roc_auc_score,
)
from sklearn.model_selection import GroupShuffleSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler


# ============================================================
# RUTAS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATASET_PATH = BASE_DIR / "dataset_asistencia.csv"
MODEL_PATH = BASE_DIR / "modelo_inasistencia.joblib"
METRICS_PATH = BASE_DIR / "metricas_modelo.json"
IMPORTANCE_PATH = BASE_DIR / "importancia_variables.csv"
PREDICTIONS_PATH = BASE_DIR / "predicciones_prueba.csv"
CONFUSION_MATRIX_PATH = BASE_DIR / "matriz_confusion.png"


# ============================================================
# CONFIGURACIÓN
# ============================================================

RANDOM_STATE = 42
TEST_SIZE = 0.25

FEATURE_COLUMNS = [
    "day_of_week",
    "appointment_hour",
    "previous_completed",
    "previous_no_show",
    "previous_cancelled",
    "previous_attendance_rate",
]

REQUIRED_COLUMNS = [
    "appointment_id",
    "patient_id",
    "appointment_date",
    "attended",
    *FEATURE_COLUMNS,
]


# ============================================================
# CARGAR DATASET
# ============================================================

def load_dataset() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(
            f"No se encontró el archivo:\n{DATASET_PATH}"
        )

    # Detecta automáticamente si el CSV usa coma o punto y coma.
    dataframe = pd.read_csv(
        DATASET_PATH,
        sep=None,
        engine="python",
    )

    # Limpiar espacios en los nombres de las columnas.
    dataframe.columns = [
        str(column).strip()
        for column in dataframe.columns
    ]

    missing_columns = [
        column
        for column in REQUIRED_COLUMNS
        if column not in dataframe.columns
    ]

    if missing_columns:
        raise ValueError(
            "Faltan columnas obligatorias en el CSV: "
            + ", ".join(missing_columns)
        )

    dataframe = dataframe.copy()

    dataframe["appointment_date"] = pd.to_datetime(
        dataframe["appointment_date"],
        errors="coerce",
    )

    numeric_columns = [
        "appointment_id",
        "patient_id",
        "attended",
        *FEATURE_COLUMNS,
    ]

    for column in numeric_columns:
        dataframe[column] = pd.to_numeric(
            dataframe[column],
            errors="coerce",
        )

    dataframe = dataframe.dropna(
        subset=[
            "appointment_id",
            "patient_id",
            "attended",
        ]
    ).copy()

    dataframe["appointment_id"] = (
        dataframe["appointment_id"].astype(int)
    )

    dataframe["patient_id"] = (
        dataframe["patient_id"].astype(int)
    )

    dataframe["attended"] = (
        dataframe["attended"].astype(int)
    )

    invalid_target_values = (
        set(dataframe["attended"].unique()) - {0, 1}
    )

    if invalid_target_values:
        raise ValueError(
            "La columna attended solo puede contener 0 o 1. "
            f"Valores encontrados: {invalid_target_values}"
        )

    # Variable objetivo del modelo:
    # attended = 1 significa que asistió.
    # attended = 0 significa que no asistió.
    #
    # no_show = 1 significa inasistencia.
    # no_show = 0 significa asistencia.
    dataframe["no_show"] = (
        1 - dataframe["attended"]
    ).astype(int)

    if dataframe["no_show"].nunique() < 2:
        raise ValueError(
            "El dataset necesita registros de asistencia "
            "e inasistencia."
        )

    print(
        "Columnas cargadas:",
        ", ".join(dataframe.columns),
    )

    return dataframe

# ============================================================
# DIVIDIR DATOS POR PACIENTE
# ============================================================

def split_dataset(
    dataframe: pd.DataFrame,
):
    features = dataframe[FEATURE_COLUMNS].copy()
    target = dataframe["no_show"].copy()
    groups = dataframe["patient_id"].copy()

    splitter = GroupShuffleSplit(
        n_splits=1,
        test_size=TEST_SIZE,
        random_state=RANDOM_STATE,
    )

    train_indexes, test_indexes = next(
        splitter.split(
            features,
            target,
            groups=groups,
        )
    )

    train_data = dataframe.iloc[
        train_indexes
    ].copy()

    test_data = dataframe.iloc[
        test_indexes
    ].copy()

    train_patient_ids = set(
        train_data["patient_id"].unique()
    )

    test_patient_ids = set(
        test_data["patient_id"].unique()
    )

    repeated_patients = (
        train_patient_ids & test_patient_ids
    )

    if repeated_patients:
        raise RuntimeError(
            "Existen pacientes repetidos entre entrenamiento "
            "y prueba."
        )

    if train_data["no_show"].nunique() < 2:
        raise RuntimeError(
            "El conjunto de entrenamiento no contiene "
            "ambas clases."
        )

    if test_data["no_show"].nunique() < 2:
        raise RuntimeError(
            "El conjunto de prueba no contiene ambas clases."
        )

    return train_data, test_data


# ============================================================
# MODELOS
# ============================================================

def create_models():
    logistic_model = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median"),
            ),
            (
                "scaler",
                StandardScaler(),
            ),
            (
                "classifier",
                LogisticRegression(
                    class_weight="balanced",
                    max_iter=3000,
                    random_state=RANDOM_STATE,
                ),
            ),
        ]
    )

    random_forest_model = Pipeline(
        steps=[
            (
                "imputer",
                SimpleImputer(strategy="median"),
            ),
            (
                "classifier",
                RandomForestClassifier(
                    n_estimators=400,
                    max_depth=8,
                    min_samples_leaf=3,
                    class_weight="balanced_subsample",
                    random_state=RANDOM_STATE,
                    n_jobs=-1,
                ),
            ),
        ]
    )

    return {
        "regresion_logistica": logistic_model,
        "bosque_aleatorio": random_forest_model,
    }


# ============================================================
# EVALUACIÓN
# ============================================================

def evaluate_model(
    model,
    test_features: pd.DataFrame,
    test_target: pd.Series,
):
    predictions = model.predict(test_features)

    probabilities = model.predict_proba(
        test_features
    )[:, 1]

    precision, recall, f1, _ = (
        precision_recall_fscore_support(
            test_target,
            predictions,
            average="binary",
            pos_label=1,
            zero_division=0,
        )
    )

    roc_auc = roc_auc_score(
        test_target,
        probabilities,
    )

    matrix = confusion_matrix(
        test_target,
        predictions,
        labels=[0, 1],
    )

    report = classification_report(
        test_target,
        predictions,
        labels=[0, 1],
        target_names=[
            "Asistió",
            "No asistió",
        ],
        zero_division=0,
        output_dict=True,
    )

    return {
        "precision_no_show": float(precision),
        "recall_no_show": float(recall),
        "f1_no_show": float(f1),
        "roc_auc": float(roc_auc),
        "confusion_matrix": matrix.tolist(),
        "classification_report": report,
        "predictions": predictions,
        "probabilities": probabilities,
    }


# ============================================================
# IMPORTANCIA DE VARIABLES
# ============================================================

def save_feature_importance(
    model_name: str,
    model,
):
    classifier = model.named_steps["classifier"]

    if model_name == "bosque_aleatorio":
        importance_values = (
            classifier.feature_importances_
        )
    else:
        importance_values = np.abs(
            classifier.coef_[0]
        )

    importance_dataframe = pd.DataFrame(
        {
            "variable": FEATURE_COLUMNS,
            "importancia": importance_values,
        }
    )

    importance_dataframe = (
        importance_dataframe.sort_values(
            by="importancia",
            ascending=False,
        )
    )

    importance_dataframe.to_csv(
        IMPORTANCE_PATH,
        index=False,
        encoding="utf-8-sig",
    )


# ============================================================
# MATRIZ DE CONFUSIÓN
# ============================================================

def save_confusion_matrix(
    matrix: np.ndarray,
):
    figure, axis = plt.subplots(
        figsize=(6, 5)
    )

    image = axis.imshow(matrix)

    axis.set_title(
        "Matriz de confusión - Inasistencia"
    )

    axis.set_xlabel("Predicción")
    axis.set_ylabel("Valor real")

    axis.set_xticks([0, 1])
    axis.set_yticks([0, 1])

    axis.set_xticklabels([
        "Asistió",
        "No asistió",
    ])

    axis.set_yticklabels([
        "Asistió",
        "No asistió",
    ])

    for row in range(matrix.shape[0]):
        for column in range(matrix.shape[1]):
            axis.text(
                column,
                row,
                str(matrix[row, column]),
                ha="center",
                va="center",
            )

    figure.colorbar(image)
    figure.tight_layout()

    figure.savefig(
        CONFUSION_MATRIX_PATH,
        dpi=150,
        bbox_inches="tight",
    )

    plt.close(figure)


# ============================================================
# ENTRENAMIENTO PRINCIPAL
# ============================================================

def main():
    print("=" * 60)
    print("ENTRENAMIENTO DEL MODELO DE INASISTENCIA")
    print("=" * 60)

    dataframe = load_dataset()

    print(
        f"Registros cargados: {len(dataframe)}"
    )

    print(
        "Pacientes únicos:",
        dataframe["patient_id"].nunique(),
    )

    print(
        "Asistencias:",
        int((dataframe["no_show"] == 0).sum()),
    )

    print(
        "Inasistencias:",
        int((dataframe["no_show"] == 1).sum()),
    )

    train_data, test_data = split_dataset(
        dataframe
    )

    train_features = train_data[
        FEATURE_COLUMNS
    ]

    train_target = train_data["no_show"]

    test_features = test_data[
        FEATURE_COLUMNS
    ]

    test_target = test_data["no_show"]

    print("-" * 60)

    print(
        f"Registros de entrenamiento: {len(train_data)}"
    )

    print(
        f"Registros de prueba: {len(test_data)}"
    )

    print(
        "Pacientes de entrenamiento:",
        train_data["patient_id"].nunique(),
    )

    print(
        "Pacientes de prueba:",
        test_data["patient_id"].nunique(),
    )

    models = create_models()

    all_metrics = {}
    trained_models = {}

    for model_name, model in models.items():
        print("-" * 60)
        print(f"Entrenando: {model_name}")

        model.fit(
            train_features,
            train_target,
        )

        metrics = evaluate_model(
            model,
            test_features,
            test_target,
        )

        trained_models[model_name] = model

        all_metrics[model_name] = {
            key: value
            for key, value in metrics.items()
            if key not in {
                "predictions",
                "probabilities",
            }
        }

        print(
            "Precisión para inasistencia:",
            f"{metrics['precision_no_show']:.4f}",
        )

        print(
            "Recall para inasistencia:",
            f"{metrics['recall_no_show']:.4f}",
        )

        print(
            "F1 para inasistencia:",
            f"{metrics['f1_no_show']:.4f}",
        )

        print(
            "ROC AUC:",
            f"{metrics['roc_auc']:.4f}",
        )

    best_model_name = max(
        all_metrics,
        key=lambda name: (
            all_metrics[name]["f1_no_show"],
            all_metrics[name]["recall_no_show"],
            all_metrics[name]["roc_auc"],
        ),
    )

    best_model = trained_models[
        best_model_name
    ]

    best_metrics = evaluate_model(
        best_model,
        test_features,
        test_target,
    )

    model_package = {
        "model": best_model,
        "model_name": best_model_name,
        "feature_columns": FEATURE_COLUMNS,
        "target": "no_show",
        "target_description": {
            "0": "Asistió",
            "1": "No asistió",
        },
        "threshold": 0.5,
    }

    joblib.dump(
        model_package,
        MODEL_PATH,
    )

    metrics_output = {
        "best_model": best_model_name,
        "dataset": {
            "total_records": int(
                len(dataframe)
            ),
            "unique_patients": int(
                dataframe[
                    "patient_id"
                ].nunique()
            ),
            "train_records": int(
                len(train_data)
            ),
            "test_records": int(
                len(test_data)
            ),
            "train_patients": int(
                train_data[
                    "patient_id"
                ].nunique()
            ),
            "test_patients": int(
                test_data[
                    "patient_id"
                ].nunique()
            ),
        },
        "models": all_metrics,
    }

    with METRICS_PATH.open(
        "w",
        encoding="utf-8",
    ) as metrics_file:
        json.dump(
            metrics_output,
            metrics_file,
            ensure_ascii=False,
            indent=2,
        )

    predictions_dataframe = test_data[
        [
            "appointment_id",
            "patient_id",
            "appointment_date",
            "attended",
        ]
    ].copy()

    predictions_dataframe[
        "real_no_show"
    ] = test_target.to_numpy()

    predictions_dataframe[
        "predicted_no_show"
    ] = best_metrics[
        "predictions"
    ]

    predictions_dataframe[
        "no_show_probability"
    ] = best_metrics[
        "probabilities"
    ]

    predictions_dataframe.to_csv(
        PREDICTIONS_PATH,
        index=False,
        encoding="utf-8-sig",
    )

    save_feature_importance(
        best_model_name,
        best_model,
    )

    save_confusion_matrix(
        np.array(
            best_metrics[
                "confusion_matrix"
            ]
        )
    )

    print("=" * 60)
    print(
        "MEJOR MODELO:",
        best_model_name,
    )

    print(
        "F1 de inasistencia:",
        f"{best_metrics['f1_no_show']:.4f}",
    )

    print(
        "Recall de inasistencia:",
        f"{best_metrics['recall_no_show']:.4f}",
    )

    print(
        "ROC AUC:",
        f"{best_metrics['roc_auc']:.4f}",
    )

    print("-" * 60)

    print(
        "Modelo guardado en:",
        MODEL_PATH,
    )

    print(
        "Métricas guardadas en:",
        METRICS_PATH,
    )

    print(
        "Importancia de variables:",
        IMPORTANCE_PATH,
    )

    print(
        "Predicciones de prueba:",
        PREDICTIONS_PATH,
    )

    print(
        "Matriz de confusión:",
        CONFUSION_MATRIX_PATH,
    )

    print("=" * 60)


if __name__ == "__main__":
    main()