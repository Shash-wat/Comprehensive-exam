let questions = [];
let currentIndex = 0;
let mode = ""; // "quiz" | "review"
let mistakes = JSON.parse(localStorage.getItem("mistakes") || "[]");

// Load JSON
fetch("questions.json")
  .then(res => res.json())
  .then(data => { questions = data; });

const quizContainer = document.getElementById("quiz-container");
const qaSection = document.getElementById("qa-section");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const feedbackEl = document.getElementById("feedback");

const nextBtn = document.getElementById("next-question");
const backBtn = document.getElementById("back-home");

document.getElementById("start-quiz").onclick = () => start("quiz");
document.getElementById("review-mistakes").onclick = () => start("review");

function start(selectedMode) {
  mode = selectedMode;
  currentIndex = 0;
  quizContainer.classList.add("hidden");
  qaSection.classList.remove("hidden");
  feedbackEl.textContent = "";
  loadQuestion();
}

function loadQuestion() {
  feedbackEl.textContent = "";
  optionsEl.innerHTML = "";
  nextBtn.classList.add("hidden");

  let source = mode === "review" ? mistakes : questions;
  if (currentIndex >= source.length) {
    endQuiz();
    return;
  }

  let q = source[currentIndex];
  questionEl.textContent = `${q.Number}. ${q.Question}`;

  q.Options.forEach(opt => {
    let btn = document.createElement("button");
    btn.textContent = opt;
    btn.className = "option-btn block w-full p-2 border rounded hover:bg-gray-200";
    btn.onclick = () => checkAnswer(q, opt, btn);
    optionsEl.appendChild(btn);
  });
}

function checkAnswer(q, chosen, btn) {
  let optionButtons = optionsEl.querySelectorAll("button");
  optionButtons.forEach(b => b.disabled = true);

  if (chosen === q.Answer) {
    btn.classList.add("correct");
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.className = "text-green-600 font-bold";
  } else {
    btn.classList.add("wrong");
    feedbackEl.textContent = `❌ Wrong! Correct: ${q.Answer}`;
    feedbackEl.className = "text-red-600 font-bold";

    // highlight correct answer
    optionButtons.forEach(b => {
      if (b.textContent === q.Answer) {
        b.classList.add("correct");
      }
    });

    if (!mistakes.find(m => m.Number === q.Number)) {
      mistakes.push(q);
      localStorage.setItem("mistakes", JSON.stringify(mistakes));
    }
  }
  nextBtn.classList.remove("hidden");
}

nextBtn.onclick = () => {
  currentIndex++;
  loadQuestion();
};

backBtn.onclick = () => {
  qaSection.classList.add("hidden");
  quizContainer.classList.remove("hidden");
};

function endQuiz() {
  questionEl.textContent = "🎉 Done!";
  optionsEl.innerHTML = "";
  feedbackEl.textContent = `Mistakes stored: ${mistakes.length}`;
  nextBtn.classList.add("hidden");
}
