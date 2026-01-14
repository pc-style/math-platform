/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';

// --- Type Definitions ---

interface TheoryItem {
  topic: string;
  content: string; // Markdown/Text
}

interface GuidedExercise {
  question: string;
  steps: string[];
  solution: string;
  tips?: string;
}

interface ExamQuestion {
  question: string;
  answer: string;
}

interface LearningPath {
  examTitle: string;
  phase1_theory: TheoryItem[];
  phase2_guided: GuidedExercise[];
  phase3_exam: ExamQuestion[];
}

interface ExamProject {
  id: string;
  title: string;
  createdAt: number;
  status: 'generating' | 'ready' | 'error';
  logs: string[];
  data?: LearningPath;
}

// --- Tool Definition ---

const createLearningPathTool: FunctionDeclaration = {
  name: 'createLearningPath',
  description: 'Creates a structured 3-phase math learning path (Theory, Guided Practice, Exam) based on provided materials.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      examTitle: {
        type: Type.STRING,
        description: 'A concise Polish title for this learning material.',
      },
      phase1_theory: {
        type: Type.ARRAY,
        description: 'Phase 1: Review of key concepts, formulas, and definitions found in the source material.',
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING, description: 'Name of the concept' },
            content: { type: Type.STRING, description: 'Detailed explanation including formulas.' },
          },
          required: ['topic', 'content'],
        },
      },
      phase2_guided: {
        type: Type.ARRAY,
        description: 'Phase 2: Example exercises with step-by-step walkthroughs.',
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: 'The math problem' },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of logical steps to solve the problem',
            },
            solution: { type: Type.STRING, description: 'The final answer' },
            tips: { type: Type.STRING, description: 'Helpful hints or common pitfalls' },
          },
          required: ['question', 'steps', 'solution'],
        },
      },
      phase3_exam: {
        type: Type.ARRAY,
        description: 'Phase 3: A test for the user to solve independently.',
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            answer: { type: Type.STRING, description: 'The correct answer for grading' },
          },
          required: ['question', 'answer'],
        },
      },
    },
    required: ['examTitle', 'phase1_theory', 'phase2_guided', 'phase3_exam'],
  },
};

// --- Application State Management ---

class App {
  projects: ExamProject[] = [];
  container: HTMLElement;

  constructor() {
    this.container = document.getElementById('app') as HTMLElement;
    this.loadProjects();
    this.renderDashboard();
  }

  loadProjects() {
    const data = localStorage.getItem('math_prep_exams');
    if (data) {
      try {
        this.projects = JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse projects', e);
        this.projects = [];
      }
    }
  }

  saveProjects() {
    localStorage.setItem('math_prep_exams', JSON.stringify(this.projects));
  }

  getProject(id: string) {
    return this.projects.find((p) => p.id === id);
  }

  updateProject(id: string, updates: Partial<ExamProject>) {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.projects[idx] = { ...this.projects[idx], ...updates };
      this.saveProjects();
    }
  }

  // --- Views ---

  renderDashboard() {
    this.container.innerHTML = `
      <header class="header">
        <a class="logo" onclick="app.renderDashboard()">MathPrep AI 🇵🇱</a>
        <button class="btn btn-primary" onclick="app.renderCreator()">+ Nowy Egzamin</button>
      </header>
      <main>
        <h2>Moje Egzaminy</h2>
        <div class="grid" id="project-grid">
          ${this.projects.length === 0 ? '<p style="color:var(--text-muted)">Brak projektów. Dodaj pierwszy egzamin!</p>' : ''}
          ${this.projects
            .sort((a, b) => b.createdAt - a.createdAt)
            .map(
              (p) => `
            <div class="card" onclick="app.openProject('${p.id}')">
              <h3 class="card-title">${p.title || 'Bez tytułu'}</h3>
              <div class="card-meta">Utworzono: ${new Date(p.createdAt).toLocaleDateString()}</div>
              <div>
                <span class="status-badge status-${p.status}">
                  ${p.status === 'ready' ? 'Gotowy' : p.status === 'generating' ? 'Generowanie...' : 'Błąd'}
                </span>
              </div>
            </div>
          `
            )
            .join('')}
        </div>
      </main>
    `;
    // Bind click events manually if needed, or rely on global calls
    (window as any).app = this;
  }

  renderCreator() {
    this.container.innerHTML = `
      <header class="header">
        <a class="logo" onclick="app.renderDashboard()">MathPrep AI 🇵🇱</a>
      </header>
      <main class="creator-layout">
        <section>
          <h2>Stwórz nowy plan nauki</h2>
          <div class="form-group">
            <label class="form-label">Nazwa projektu</label>
            <input type="text" id="exam-title" class="form-input" placeholder="np. Matura Matematyka 2024">
          </div>
          <div class="form-group">
            <label class="form-label">Materiały (PDF)</label>
            <div class="file-drop" onclick="document.getElementById('file-input').click()">
              <p>Kliknij aby dodać pliki PDF</p>
              <input type="file" id="file-input" multiple accept="application/pdf" style="display:none" onchange="app.handleFileSelect(this)">
              <div id="file-list" style="margin-top:1rem; font-size:0.875rem;"></div>
            </div>
          </div>
          <button id="generate-btn" class="btn btn-primary" style="width:100%" onclick="app.startGeneration()">Generuj Plan Nauki</button>
        </section>
        
        <section>
          <h3>Logi Systemowe</h3>
          <div class="progress-container">
            <div class="progress-bar" id="progress-bar" style="width: 0%"></div>
          </div>
          <div class="console" id="console-output">
            <div class="log-entry">Oczekiwanie na pliki...</div>
          </div>
        </section>
      </main>
    `;
  }

  // --- Logic ---

  selectedFiles: File[] = [];

  handleFileSelect(input: HTMLInputElement) {
    if (input.files) {
      this.selectedFiles = Array.from(input.files);
      const list = document.getElementById('file-list');
      if (list) {
        list.innerHTML = this.selectedFiles.map((f) => `<div>📄 ${f.name}</div>`).join('');
      }
    }
  }

  async startGeneration() {
    const titleInput = document.getElementById('exam-title') as HTMLInputElement;
    const title = titleInput.value || 'Nowy Egzamin';
    
    if (this.selectedFiles.length === 0) {
      alert('Proszę dodać przynajmniej jeden plik PDF.');
      return;
    }

    const projectId = crypto.randomUUID();
    const newProject: ExamProject = {
      id: projectId,
      title: title,
      createdAt: Date.now(),
      status: 'generating',
      logs: ['Rozpoczęto proces...'],
    };

    this.projects.push(newProject);
    this.saveProjects();

    // Disable UI
    const btn = document.getElementById('generate-btn') as HTMLButtonElement;
    if (btn) btn.disabled = true;

    // Start Process
    await this.processFilesWithGemini(newProject);
  }

  logToConsole(msg: string, progress: number) {
    const consoleEl = document.getElementById('console-output');
    const bar = document.getElementById('progress-bar');
    if (consoleEl) {
      const entry = document.createElement('div');
      entry.className = 'log-entry';
      entry.textContent = `> ${msg}`;
      consoleEl.appendChild(entry);
      consoleEl.scrollTop = consoleEl.scrollHeight;
    }
    if (bar) {
      bar.style.width = `${progress}%`;
    }
  }

  async processFilesWithGemini(project: ExamProject) {
    this.logToConsole('Wczytywanie plików PDF...', 10);
    
    try {
      // 1. Convert Files to Base64
      const fileParts = await Promise.all(
        this.selectedFiles.map(async (file) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              // Remove data URL prefix
              const base64Data = result.split(',')[1];
              resolve(base64Data);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          return {
            inlineData: {
              data: base64,
              mimeType: 'application/pdf',
            },
          };
        })
      );

      this.logToConsole(`Wczytano ${fileParts.length} plików. Łączenie z Gemini 3 Flash...`, 30);
      this.updateProject(project.id, { logs: [...project.logs, 'Pliki przetworzone, wysyłanie do API...'] });

      // 2. Call Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      this.logToConsole('Analiza treści i generowanie OBSZERNEGO planu (to może potrwać)...', 50);

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          ...fileParts,
          {
            role: 'user',
            parts: [
              {
                text: `Przeanalizuj dogłębnie przesłane pliki PDF (materiały do nauki matematyki).
                Stwórz BARDZO OBSZERNY i SZCZEGÓŁOWY trzystopniowy plan nauki w języku polskim.
                
                Twoim celem jest przygotowanie ucznia w 100%. Generuj DUŻO treści. Nie streszczaj.
                
                Użyj narzędzia 'createLearningPath' aby wygenerować strukturę.
                
                SZCZEGÓŁOWE WYTYCZNE:
                
                1. Faza I (Teoria): Musisz wygenerować MINIMUM 15-20 kluczowych zagadnień.
                   - Każde zagadnienie musi być wyczerpująco opisane.
                   - Wypisz wszystkie wzory, definicje i twierdzenia z materiałów.
                   
                2. Faza II (Ćwiczenia kierowane): Musisz wygenerować MINIMUM 10-15 rozbudowanych zadań.
                   - Pokryj różne typy zadań pojawiające się w materiałach.
                   - Każde zadanie musi mieć BARDZO DOKŁADNE rozwiązanie krok po kroku.
                   
                3. Faza III (Egzamin próbny): Musisz wygenerować MINIMUM 10-15 zadań egzaminacyjnych do samodzielnego rozwiązania.
                
                Pamiętaj: Lepiej wygenerować za dużo niż za mało. Bądź precyzyjny matematycznie.
                `,
              },
            ],
          },
        ],
        config: {
          tools: [{ functionDeclarations: [createLearningPathTool] }],
          // Allow thinking to plan the extensive content structure
          thinkingConfig: { thinkingBudget: 4096 },
        },
      });

      this.logToConsole('Otrzymano odpowiedź z API. Przetwarzanie danych...', 90);

      // 3. Process Response
      const functionCalls = response.functionCalls;
      if (functionCalls && functionCalls.length > 0) {
        const call = functionCalls[0];
        if (call.name === 'createLearningPath') {
          const data = call.args as unknown as LearningPath;
          
          this.updateProject(project.id, {
            status: 'ready',
            data: data,
            title: data.examTitle || project.title, // Update title if AI suggests a better one
            logs: [...project.logs, 'Generowanie zakończone sukcesem.'],
          });
          
          this.logToConsole('Gotowe! Przekierowywanie...', 100);
          setTimeout(() => this.openProject(project.id), 1000);
          return;
        }
      }

      throw new Error('Model nie wywołał oczekiwanej funkcji.');

    } catch (error) {
      console.error(error);
      this.logToConsole(`BŁĄD: ${(error as Error).message}`, 100);
      const bar = document.getElementById('progress-bar');
      if (bar) bar.style.backgroundColor = '#ef4444';
      
      this.updateProject(project.id, {
        status: 'error',
        logs: [...project.logs, `Error: ${(error as Error).message}`],
      });
    }
  }

  // --- Study View ---

  openProject(id: string) {
    const project = this.getProject(id);
    if (!project) return;
    
    if (project.status === 'generating') {
        alert("Ten projekt jest w trakcie generowania. Proszę czekać.");
        return;
    }
    
    if (project.status === 'error') {
        alert("Wystąpił błąd podczas generowania tego projektu. Spróbuj ponownie utworzyć nowy.");
        return;
    }

    if (!project.data) return;

    this.renderStudyView(project, 1);
  }

  renderStudyView(project: ExamProject, phase: number) {
    const data = project.data!;
    
    let contentHtml = '';
    let activePhaseName = '';

    if (phase === 1) {
      activePhaseName = 'Faza I: Teoria';
      contentHtml = `
        <h2 class="section-title">Faza I: Przegląd Teorii</h2>
        <p style="margin-bottom:2rem; color:var(--text-muted)">Liczba zagadnień: ${data.phase1_theory.length}</p>
        ${data.phase1_theory.map(item => `
          <div class="theory-item">
            <h3>${item.topic}</h3>
            <div style="line-height: 1.6;">${item.content.replace(/\n/g, '<br>')}</div>
          </div>
        `).join('')}
      `;
    } else if (phase === 2) {
      activePhaseName = 'Faza II: Ćwiczenia';
      contentHtml = `
        <h2 class="section-title">Faza II: Ćwiczenia z Przewodnikiem</h2>
        <p style="margin-bottom:2rem; color:var(--text-muted)">Liczba ćwiczeń: ${data.phase2_guided.length}. Przeanalizuj poniższe przykłady i sposób ich rozwiązania.</p>
        ${data.phase2_guided.map((item, idx) => `
          <div class="exercise-item">
            <div style="font-weight:bold; margin-bottom:1rem;">Zadanie ${idx + 1}: ${item.question}</div>
            
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('steps-${idx}').classList.toggle('hidden')">
              Pokaż/Ukryj Rozwiązanie
            </button>

            <div id="steps-${idx}" class="steps-container hidden">
              <h4>Kroki rozwiązania:</h4>
              ${item.steps.map((step, sIdx) => `
                <div class="step">
                  <span class="step-num">${sIdx + 1}.</span>
                  <span>${step}</span>
                </div>
              `).join('')}
              
              <div style="margin-top:1rem; font-weight:bold; border-top:1px solid #cbd5e1; padding-top:0.5rem;">
                Odpowiedź: ${item.solution}
              </div>
              ${item.tips ? `<div style="margin-top:0.5rem; color:#854d0e; font-size:0.9rem;">💡 Wskazówka: ${item.tips}</div>` : ''}
            </div>
          </div>
        `).join('')}
      `;
    } else if (phase === 3) {
      activePhaseName = 'Faza III: Egzamin';
      contentHtml = `
        <h2 class="section-title">Faza III: Egzamin Próbny</h2>
        <p style="margin-bottom:2rem; color:var(--text-muted)">Liczba pytań: ${data.phase3_exam.length}. Rozwiąż zadania samodzielnie.</p>
        ${data.phase3_exam.map((item, idx) => `
          <div class="exercise-item">
            <div style="font-weight:bold; margin-bottom:1rem;">Pytanie ${idx + 1}:</div>
            <div style="margin-bottom:1rem; font-family:serif; font-size:1.1rem;">${item.question}</div>
            
            <button class="reveal-btn btn btn-secondary" onclick="document.getElementById('ans-${idx}').classList.remove('hidden')">
              Sprawdź Odpowiedź
            </button>
            <div id="ans-${idx}" class="answer-key hidden">
              Poprawna odpowiedź: <strong>${item.answer}</strong>
            </div>
          </div>
        `).join('')}
      `;
    }

    this.container.innerHTML = `
      <header class="header">
        <a class="logo" onclick="app.renderDashboard()">MathPrep AI 🇵🇱</a>
        <div>${project.title}</div>
      </header>
      <main class="study-layout">
        <aside class="sidebar">
          <div class="nav-item ${phase === 1 ? 'active' : ''}" onclick="app.renderStudyView(app.getProject('${project.id}'), 1)">
            Faza I: Teoria
          </div>
          <div class="nav-item ${phase === 2 ? 'active' : ''}" onclick="app.renderStudyView(app.getProject('${project.id}'), 2)">
            Faza II: Ćwiczenia
          </div>
          <div class="nav-item ${phase === 3 ? 'active' : ''}" onclick="app.renderStudyView(app.getProject('${project.id}'), 3)">
            Faza III: Egzamin
          </div>
        </aside>
        <section class="content-area">
          ${contentHtml}
        </section>
      </main>
    `;
  }
}

// Initialize Application
window.onload = () => {
  new App();
};
