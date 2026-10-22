/**
 * Direct Firebase Firestore Seeder for KrushiAR Crop Questions
 * Run with: node scripts/seedFirestoreDirect.mjs
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAU0zBqNVLLhNeptr28bzIhaPSHbTZn8Gs",
  authDomain: "krushiar.firebaseapp.com",
  projectId: "krushiar",
  storageBucket: "krushiar.firebasestorage.app",
  messagingSenderId: "1023607370975",
  appId: "1:1023607370975:web:krushiar-admin-portal",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const ONION_DATASET = {
  cropId: "onion",
  cropName: {
    mr: "कांदा",
    hi: "प्याज",
    en: "Onion"
  },
  aliases: ["कांदा", "कांदे", "प्याज", "pyaj", "kanda", "onion"],
  category: "Horticulture",
  iconEmoji: "🧅",
  bannerGradient: "from-rose-600 via-red-600 to-amber-600",
  activities: {
    planting: {
      title: { mr: "कांदा पुनर्लागवड / पेरणी", hi: "प्याज रोपाई / बुवाई", en: "Onion Transplanting" },
      questions: [
        { id: "onion_plant_1", key: "variety", mr: "कांद्याची कोणती जात लावली? (उदा. भीमा सुपर, भीमा लाल, प्रशांत, गावरान)", hi: "प्याज की कौन सी किस्म लगाई? (उदा. भीमा सुपर, भीमा लाल, प्रशांत, गावरान)", en: "Which onion variety was planted? (e.g. Bhima Super, Bhima Red, Gavran)" },
        { id: "onion_plant_2", key: "area_method", mr: "किती क्षेत्रावर पुनर्लागवड केली आणि गादीवाफ्यावर (BBF) की सपाट वाफ्यावर?", hi: "कितने क्षेत्र में रोपाई की और मेड़ (BBF) पर या सपाट क्यारी में?", en: "How much area was transplanted and was it on raised beds (BBF) or flat beds?" },
        { id: "onion_plant_3", key: "expense_labour", mr: "कांदा रोपे आणि लागवड मजुरीचा एकूण खर्च किती झाला?", hi: "प्याज की पौध और रोपाई मजदूरी का कुल खर्च कितना हुआ?", en: "What was the total cost for onion seedlings and planting labour?" }
      ]
    },
    pesticide: {
      title: { mr: "फवारणी / कीटकनाशक", hi: "छिड़काव / कीटनाशक", en: "Spraying / Pesticide" },
      questions: [
        { id: "onion_pest_1", key: "pest_or_disease", mr: "कांद्यावर मुख्यत्वे कशासाठी फवारणी केली? (उदा. थ्रिप्स/फुलकिडे, जांभळा करपा, पीळ पडणे किंवा टॉनिक)", hi: "प्याज पर मुख्य रूप से किसके लिए छिड़काव किया? (उदा. थ्रिप्स, बैंगनी धब्बा या टॉनिक)", en: "What was the primary reason for spraying? (e.g., Thrips, Purple Blotch, Twister or Tonic)" },
        { id: "onion_pest_2", key: "chemical_used", mr: "कोणते औषध, बुरशीनाशक किंवा स्टीकर फवारले आणि प्रमाण किती ठेवले?", hi: "कौन सी दवा, फफूंदनाशक या स्टीकर का छिड़काव किया और मात्रा क्या रखी?", en: "Which pesticide, fungicide or sticker was sprayed and in what dose?" },
        { id: "onion_pest_3", key: "expense_spray", mr: "फवारणी औषधे व मजुरीचा एकूण किती खर्च झाला?", hi: "छिड़काव की दवाओं और मजदूरी का कुल कितना खर्च हुआ?", en: "What was the total expenditure on spray medicines and labour?" }
      ]
    },
    fertilizer: {
      title: { mr: "खत व्यवस्थापन", hi: "उर्वरक प्रबंधन", en: "Fertilizer Application" },
      questions: [
        { id: "onion_fert_1", key: "fertilizer_details", mr: "कोणते खत दिले? (उदा. १०:२६:२६, डीएपी, गंधक/सल्फर, विद्राव्य खत ००:५२:३४)?", hi: "कौन सा खाद दिया? (उदा. 10:26:26, डीएपी, सल्फर, घुलनशील 00:52:34)?", en: "Which fertilizer was applied? (e.g. 10:26:26, DAP, Sulphur, 00:52:34)?" },
        { id: "onion_fert_2", key: "application_mode", mr: "खत जमिनीत फेकून दिले की ठिबकद्वारे सोडले आणि प्रमाण किती होते?", hi: "खाद खेत में बखेर कर दिया या ड्रिप से छोड़ा और मात्रा कितनी थी?", en: "Was fertilizer broadcasted in soil or given via drip, and what was the quantity?" },
        { id: "onion_fert_3", key: "expense_fert", mr: "खत खरेदी आणि मजुरीचा एकूण खर्च किती झाला?", hi: "खाद खरीद और मजदूरी का कुल खर्च कितना हुआ?", en: "What was the total cost of fertilizer purchase and application labour?" }
      ]
    },
    weeding: {
      title: { mr: "खुरपणी / तण नियंत्रण", hi: "निराई / खरपतवार नियंत्रण", en: "Weeding & Weed Control" },
      questions: [
        { id: "onion_weed_1", key: "weed_method", mr: "तण नियंत्रण हाताने खुरपणी करून केले की तणनाशक (टरगा सुपर, गोल) फवारले?", hi: "खरपतवार नियंत्रण हाथ से निराई करके किया या खरपतवार नाशक (टरगा सुपर, गोल) का छिड़काव किया?", en: "Was weeding done manually by hand or by spraying herbicide (Targa Super, Goal)?" },
        { id: "onion_weed_2", key: "expense_weeding", mr: "खुरपणी मजुरी किंवा तणनाशकाचा एकूण खर्च किती झाला?", hi: "निराई मजदूरी या खरपतवार नाशक का कुल खर्च कितना हुआ?", en: "What was the total cost of manual weeding labour or herbicide?" }
      ]
    },
    irrigation: {
      title: { mr: "पाणी देणे / सिंचन", hi: "सिंचाई", en: "Irrigation" },
      questions: [
        { id: "onion_irrig_1", key: "irrigation_details", mr: "कांद्याला पाणी ठिबकने दिले, तुषारने (स्प्रिंकलर) की पाटपाणी सोडले? किती वेळ चालवले?", hi: "प्याज को पानी ड्रिप से दिया, स्प्रिंकलर से या खुला पानी दिया? कितने घंटे चलाया?", en: "Was onion watered via drip, sprinkler, or flood irrigation? How long did it run?" }
      ]
    },
    harvesting: {
      title: { mr: "काढणी व तोडणी", hi: "खुदाई व कटाई", en: "Harvesting & Curing" },
      questions: [
        { id: "onion_harv_1", key: "harvest_yield", mr: "कांदा काढणी किती क्षेत्राची झाली आणि किती गोणी/क्विंटल माल निघाला?", hi: "प्याज की खुदाई कितने क्षेत्र की हुई और कितनी बोरी/क्विंटल उत्पादन निकला?", en: "How much area was harvested and how many bags/quintals of onion were produced?" },
        { id: "onion_harv_2", key: "harvest_labor_cost", mr: "काढणे, पात कापणे आणि गोणी भरण्यासाठी मजुरी किती लागली?", hi: "खुदाई, पत्ती कटाई और बोरी भरने में मजदूरी का कितना खर्च लगा?", en: "What was the labour cost for harvesting, detopping and bagging?" }
      ]
    },
    sales: {
      title: { mr: "विक्री व बाजारभाव", hi: "बिक्री व मंडी भाव", en: "Sales & Mandi Realization" },
      questions: [
        { id: "onion_sale_1", key: "market_and_quantity", mr: "कांदा कोणत्या बाजारात/मार्केटला विकला आणि किती क्विंटल किंवा गोणी विकल्या?", hi: "प्याज किस मंडी/बाजार में बेचा और कितने क्विंटल या बोरी बेची?", en: "Which mandi/market was the onion sold in, and how many quintals or bags were sold?" },
        { id: "onion_sale_2", key: "rate_and_revenue", mr: "कांद्याला काय भाव मिळाला (प्रति क्विंटल किंवा किलो) आणि एकूण किती रक्कम मिळाली?", hi: "प्याज का क्या भाव मिला (प्रति क्विंटल या किलो) और कुल कितनी राशि मिली?", en: "What rate did you get per quintal or kg, and what was the total revenue?" },
        { id: "onion_sale_3", key: "transport_expense", mr: "गाडीभाडे, हमाली आणि तोलाईचा एकूण किती खर्च झाला?", hi: "गाड़ी भाड़ा, पल्लेदारी (हमाली) और तौलाई का कुल कितना खर्च हुआ?", en: "What was the total expense for transport, porterage (hamali) and weighing?" }
      ]
    },
    other: {
      title: { mr: "इतर कामे", hi: "अन्य कार्य", en: "Other Activities" },
      questions: [
        { id: "onion_other_1", key: "general_work", mr: "कांद्याशी संबंधित कोणते काम केले व किती खर्च आला?", hi: "प्याज से संबंधित कौन सा कार्य किया और कितना खर्च हुआ?", en: "What onion-related work was performed and what was the cost?" }
      ]
    }
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "KrushiAR Admin Script"
};

async function seed() {
  console.log("Writing Onion dataset to Firestore collection 'crop_questions/onion'...");
  try {
    const docRef = doc(db, "crop_questions", "onion");
    await setDoc(docRef, ONION_DATASET, { merge: true });
    console.log("SUCCESS! crop_questions/onion written to Firestore successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Firestore Write Failed:", err.message);
    if (err.message.includes("permission") || err.code === "permission-denied") {
      console.log("\n=======================================================");
      console.log("ACTION REQUIRED: Update Firestore Security Rules in Firebase Console:");
      console.log("https://console.firebase.google.com/project/krushiar/firestore/rules\n");
      console.log("Add this rule inside match /databases/{database}/documents { ... }:");
      console.log(`
match /crop_questions/{cropId} {
  allow read, write: if true;
}
      `);
      console.log("=======================================================\n");
    }
    process.exit(1);
  }
}

seed();
