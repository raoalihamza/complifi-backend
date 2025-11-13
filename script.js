require("dotenv").config();

const GEMINI_API_KEY = "";

async function getModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    const data = await response.json();

    // Show model names
    const names = data.models?.map((m) => m.name);
    console.log(names);
  } catch (err) {
    console.error("Error:", err);
  }
}

getModels();
