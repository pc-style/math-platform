
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load local env vars
dotenv.config({ path: path.join(__dirname, "../.env.local") });

async function testGeneration() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ BŁĄD: GEMINI_API_KEY nie został znaleziony w .env.local");
        process.exit(1);
    }

    const pdfPath = path.join(__dirname, "../example/example.pdf");
    if (!fs.existsSync(pdfPath)) {
        console.error(`❌ BŁĄD: Nie znaleziono pliku @[example/example.pdf] pod ścieżką: ${pdfPath}`);
        process.exit(1);
    }

    console.log("📂 Wczytywanie pliku PDF...");
    const pdfBuffer = fs.readFileSync(pdfPath);
    const base64 = pdfBuffer.toString("base64");

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using the latest available thinking model
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    console.log("🧠 Uruchamianie Gemini 2.0 Flash Thinking...");

    try {
        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64,
                    mimeType: "application/pdf",
                },
            },
            `Przeanalizuj ten plik PDF i stwórz SZCZEGÓŁOWY plan nauki matematyki po polsku. Zwróć JSON zgodny z tą strukturą: { "examTitle": "Tytuł", "phase1_theory": [{"topic": "...", "content": "..."}], "phase2_guided": [{"question": "...", "steps": ["..."], "solution": "...", "tips": "..."}], "phase3_exam": [{"question": "...", "answer": "..."}] }. Zwróć TYLKO czysty obiekt JSON bez znaczników markdown ani tekstu przed/po.`,
        ]);

        const text = result.response.text();
        console.log("\n--- ODPOWIEDŹ AI ---");
        console.log(text);
        console.log("-------------------\n");

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            let jsonStr = jsonMatch[0];
            // Fix potential syntax issues if the model provided a non-strict JSON
            try {
                const data = JSON.parse(jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, ''));
                console.log("✅ SUKCES: Pomyślnie wygenerowano i sparsowano dane JSON.");
                console.log(`📌 Tytuł: ${data.examTitle}`);
                console.log(`📚 Teoria: ${data.phase1_theory.length} tematów`);
                console.log(`📝 Zadania: ${data.phase2_guided.length} ćwiczeń`);
                console.log(`🏆 Egzamin: ${data.phase3_exam.length} pytań`);

                fs.writeFileSync(path.join(__dirname, "last_test_result.json"), JSON.stringify(data, null, 2));
                console.log(`💾 Wynik zapisany do scripts/last_test_result.json`);
            } catch (e) {
                console.error("❌ BŁĄD PARSOWANIA JSON: Model zwrócił niepoprawny format.");
                console.error(e.message);
                console.log("Próba zapisu surowego tekstu do debug_raw.txt...");
                fs.writeFileSync(path.join(__dirname, "debug_raw.txt"), text);
            }
        } else {
            console.error("❌ BŁĄD: Nie udało się wyodrębnić JSON z odpowiedzi AI.");
        }
    } catch (err) {
        console.error("❌ BŁĄD PODCZAS GENERACJI:");
        console.error(err);
    }
}

testGeneration();
