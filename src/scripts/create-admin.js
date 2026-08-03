const admin = require("../config/firebase");
const supabase = require("../config/supabase");
const { getAuth } = require("firebase-admin/auth");
const [, , email, password, displayName] = process.argv;
if (!email || !password || !displayName) {
  console.log(
    'Usage: node src/scripts/create-admin.js <email> <password> <displayName>'
  );
  process.exit(1);
}
async function createAdmin() {
  try {
    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName,
    });

    console.log("Firebase user created successfully!");
    console.log("UID:", userRecord.uid);
    const { error } = await supabase
  .from("users")
  .upsert({
    id: userRecord.uid,
    email: userRecord.email,
    display_name: userRecord.displayName,
    role: "admin",
   
  });

if (error) {
  throw error;
}

console.log("Admin saved to Supabase successfully!");
 


    console.log("\n==============================");
    console.log("Admin created successfully!");
    console.log("==============================");
    console.log("Email:", userRecord.email);
    console.log("Name:", userRecord.displayName);
    console.log("UID:", userRecord.uid);
    console.log("Role: admin");


  } catch (error) {
    console.error("Error creating Firebase user:", error.message);
  }
}

createAdmin();