const fs = require("fs");
const path = require("path");

/**
 * Lit un fichier JSON de manière sécurisée.
 * Retourne un objet vide {} si le fichier n'existe pas ou est corrompu.
 */

function readData(fileName) {
  const filePath = path.resolve(__dirname, "..", fileName);

  if (!fs.existsSync(filePath)) {
    // Crée le fichier vide s'il n'existe pas
    fs.writeFileSync(filePath, JSON.stringify({}, null, 4));
    return {};
  }

  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.trim() ? JSON.parse(content) : {};
  } catch (error) {
    console.error(`[DATABASE ERROR] Impossible de lire ${fileName}:`, error);
    return {};
  }
}

/**
 * Sauvegarde des données dans un fichier JSON avec une indentation propre.
 */
function saveData(fileName, data) {
  const filePath = path.resolve(__dirname, "..", fileName);
  try {
    const jsonData = JSON.stringify(data, null, 4);
    fs.writeFileSync(filePath, jsonData, "utf8");
    return true;
  } catch (error) {
    console.error(
      `[DATABASE ERROR] Impossible d'écrire dans ${fileName}:`,
      error,
    );
    return false;
  }
}

module.exports = {
  readData,
  saveData,
};
 