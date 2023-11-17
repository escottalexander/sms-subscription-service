import fs from "fs";
import csv from "csv-parser";

// CSV file path
const csvDirectoryPath = "./contact_exports/2023-11-12-contacts";
const memory = {};
let completedStreams = 0;

fs.readdir(csvDirectoryPath, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

  const totalStreams = files.length;

  for (const file of files) {
    console.log(file);
    fs.createReadStream(`${csvDirectoryPath}/${file}`)
      .pipe(csv())
      .on("data", (row) => {
        // Skip unsubscribed numbers
        if (row && row.Unsubscribed) {
          return;
        }
        const code = file.replace(".csv", "").toUpperCase();
        if (!memory[row.Number]) {
          memory[row.Number] = [];
        }
        memory[row.Number].push({
          ...row,
          code,
        });
      })
      .on("end", () => {
        console.log("CSV import completed for " + file);
        completedStreams++;

        if (completedStreams === totalStreams) {
          // All streams have completed
          console.log("All CSV streams have completed.");
          // console.log("Memory object:", memory);
          const filteredObject = Object.fromEntries(
            Object.keys(memory)
              .filter(key => memory[key].length > 1)
              .map(key => [key, memory[key]])
          );
          console.log(filteredObject);
        }
      });
  }
});
