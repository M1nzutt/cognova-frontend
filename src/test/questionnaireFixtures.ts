import type { QuestionnaireCatalog, QuestionnaireResponse } from '../types/questionnaire'

// Test-only snapshot of the pinned backend catalog, never bundled by the app.
export const catalog: QuestionnaireCatalog = {
  "questionnaire_version": 1,
  "questions": [
    {
      "id": "q1",
      "text": "¿Cuál es tu objetivo académico principal?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "organize_time",
          "label": "Organizar mejor mi tiempo"
        },
        {
          "id": "be_consistent",
          "label": "Ser más constante"
        },
        {
          "id": "complete_activities",
          "label": "Cumplir mejor mis actividades"
        },
        {
          "id": "prepare_assessments",
          "label": "Prepararme para evaluaciones"
        },
        {
          "id": "understand_subjects",
          "label": "Entender mejor mis materias"
        },
        {
          "id": "reduce_procrastination",
          "label": "Reducir la procrastinación"
        },
        {
          "id": "other",
          "label": "Otro"
        }
      ]
    },
    {
      "id": "q2",
      "text": "¿Cuántos días a la semana estudias fuera de clases?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "almost_never",
          "label": "Casi nunca"
        },
        {
          "id": "one_two_days",
          "label": "1–2 días"
        },
        {
          "id": "three_four_days",
          "label": "3–4 días"
        },
        {
          "id": "five_six_days",
          "label": "5–6 días"
        },
        {
          "id": "every_day",
          "label": "Todos los días"
        }
      ]
    },
    {
      "id": "q3",
      "text": "¿En qué momento del día estudias mejor?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "morning",
          "label": "Mañana"
        },
        {
          "id": "afternoon",
          "label": "Tarde"
        },
        {
          "id": "night",
          "label": "Noche"
        },
        {
          "id": "depends",
          "label": "Depende"
        }
      ]
    },
    {
      "id": "q4",
      "text": "¿Cuánto dura normalmente una sesión de estudio?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "under_30_minutes",
          "label": "Menos de 30 min"
        },
        {
          "id": "30_60_minutes",
          "label": "30–60 min"
        },
        {
          "id": "one_two_hours",
          "label": "1–2 horas"
        },
        {
          "id": "over_two_hours",
          "label": "Más de 2 horas"
        },
        {
          "id": "varies",
          "label": "Varía mucho"
        }
      ]
    },
    {
      "id": "q5",
      "text": "¿Qué tan seguido cumples lo que planeas estudiar?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "almost_never",
          "label": "Casi nunca"
        },
        {
          "id": "rarely",
          "label": "Pocas veces"
        },
        {
          "id": "sometimes",
          "label": "A veces"
        },
        {
          "id": "almost_always",
          "label": "Casi siempre"
        },
        {
          "id": "always",
          "label": "Siempre"
        }
      ]
    },
    {
      "id": "q6",
      "text": "¿Qué suele dificultarte estudiar?",
      "selection": "multi",
      "min_choices": 1,
      "max_choices": 3,
      "options": [
        {
          "id": "distractions",
          "label": "Distracciones"
        },
        {
          "id": "tiredness",
          "label": "Cansancio"
        },
        {
          "id": "lack_of_time",
          "label": "Falta de tiempo"
        },
        {
          "id": "lack_of_motivation",
          "label": "Falta de motivación"
        },
        {
          "id": "not_knowing_where_to_start",
          "label": "No saber por dónde empezar"
        },
        {
          "id": "too_many_activities",
          "label": "Demasiadas actividades"
        },
        {
          "id": "difficulty_with_subject",
          "label": "Dificultad con una materia"
        },
        {
          "id": "other",
          "label": "Otro"
        }
      ]
    },
    {
      "id": "q7",
      "text": "¿Cómo organizas tus actividades académicas?",
      "selection": "multi",
      "min_choices": 1,
      "max_choices": 2,
      "options": [
        {
          "id": "planner_calendar",
          "label": "Agenda o calendario"
        },
        {
          "id": "application",
          "label": "Aplicación"
        },
        {
          "id": "phone_notes",
          "label": "Notas en el celular"
        },
        {
          "id": "notebook",
          "label": "Cuaderno"
        },
        {
          "id": "memory",
          "label": "De memoria"
        },
        {
          "id": "only_urgent",
          "label": "Solo organizo lo urgente"
        },
        {
          "id": "no_method",
          "label": "No tengo un método"
        },
        {
          "id": "other",
          "label": "Otro"
        }
      ]
    },
    {
      "id": "q8",
      "text": "¿Cómo decides qué actividad hacer primero?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "most_urgent",
          "label": "La más urgente"
        },
        {
          "id": "most_important",
          "label": "La más importante"
        },
        {
          "id": "hardest",
          "label": "La más difícil"
        },
        {
          "id": "quickest",
          "label": "La más rápida"
        },
        {
          "id": "by_subject",
          "label": "Según la materia"
        },
        {
          "id": "by_mood",
          "label": "Según mis ganas"
        },
        {
          "id": "no_criterion",
          "label": "No tengo un criterio"
        }
      ]
    },
    {
      "id": "q9",
      "text": "¿Qué haces cuando no cumples una sesión planeada?",
      "selection": "single",
      "min_choices": 1,
      "max_choices": 1,
      "options": [
        {
          "id": "reschedule",
          "label": "La reprogramo"
        },
        {
          "id": "later",
          "label": "La hago más tarde"
        },
        {
          "id": "partially",
          "label": "Hago solo una parte"
        },
        {
          "id": "cancel",
          "label": "La cancelo"
        },
        {
          "id": "leave_pending",
          "label": "La dejo pendiente"
        },
        {
          "id": "depends",
          "label": "Depende"
        }
      ]
    },
    {
      "id": "q10",
      "text": "¿Qué te gustaría entender mejor sobre tu forma de estudiar?",
      "selection": "multi",
      "min_choices": 1,
      "max_choices": 3,
      "options": [
        {
          "id": "best_times",
          "label": "Mis mejores horarios"
        },
        {
          "id": "consistency",
          "label": "Mi constancia"
        },
        {
          "id": "actual_study_time",
          "label": "Mi tiempo real de estudio"
        },
        {
          "id": "plan_completion",
          "label": "Si cumplo lo que planeo"
        },
        {
          "id": "neglected_subjects",
          "label": "Qué materias descuido más"
        },
        {
          "id": "why_postpone",
          "label": "Por qué aplazo actividades"
        },
        {
          "id": "time_distribution",
          "label": "Cómo distribuyo mi tiempo"
        },
        {
          "id": "helpful_habits",
          "label": "Qué hábitos me ayudan"
        }
      ]
    }
  ]
}

export const response: QuestionnaireResponse = {
  revision: 1, questionnaire_version: 1, recorded_at: '2026-10-13T10:00:00Z',
  answers: Object.fromEntries(catalog.questions.map(q => [q.id, { choices: [q.options[0].id], other_text: null }])) as QuestionnaireResponse['answers'],
}
