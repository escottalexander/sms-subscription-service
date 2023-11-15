import fs from "fs";
import csv from "csv-parser";
import { MongoClient } from "mongodb";
import parsePhoneNumberFromString from "libphonenumber-js";

// MongoDB connection URI
const mongoURI = "mongodb+srv://escottalexander:EsaEsa1991@cluster0.7uvfcll.mongodb.net/sms-subscription-service"; // mongodb+srv://escottalexander:EsaEsa1991@cluster0.7uvfcll.mongodb.net
// CSV file path
const csvDirectoryPath = "./contact_exports/2023-11-12-contacts";

// Connect to MongoDB
const client = new MongoClient(mongoURI);
fs.readdir(csvDirectoryPath, (err, files) => {
  if (err) {
    console.error("Error reading directory:", err);
    return;
  }

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
        const toInsert = csvDataAdapter(row, code);
        console.log(toInsert);
        client.db().collection("phone-numbers").updateOne({phoneNumber: toInsert.phoneNumber}, {$set: toInsert}, {upsert: true}, (insertErr, result) => {
            if (insertErr) {
              console.error('Error inserting document:', insertErr);
            } else {
              console.log('Inserted document:', result.ops[0]);
            }
          });
      })
      .on("end", () => {
        console.log("CSV import completed for " + file);
      });
  };
});

function csvDataAdapter(data, campaignCode) {
  // {
  //     Number: "4087263166",
  //     "First Name": "",
  //     "Last Name": "",
  //     Email: "",
  //     Birthday: "",
  //     Note: "",
  //     "Create Date": "08/05/2021 02:49 PM",
  //     "Opt-in method": "Keyword (ameliach)",
  //     Unsubscribed: "",
  //   }
  // Parse phone number
  let phone;
  try {
    phone = parsePhoneNumberFromString(data.Number, "US").number;
    if (!phone) {
      throw new Error("Failed to parse phone number.");
    }
  } catch (e) {
    console.error(
      `Could not parse '${data.Number}' as a phone number: ${JSON.stringify(
        e.message
      )}`
    );
  }
  return {
    phoneNumber: phone,
    isActive: data.Unsubscribed ? false : true,
    campaignCode,
  };
}
