// Crop Questions Types and Agricultural Datasets for KrushiAR

export interface LocalizedText {
  mr: string;
  hi: string;
  en: string;
}

export interface CropQuestionItem {
  id: string;
  key: string;
  mr: string;
  hi: string;
  en: string;
  hint?: string;
  required?: boolean;
}

export interface CropActivityConfig {
  title: LocalizedText;
  icon?: string;
  questions: CropQuestionItem[];
}

export interface CropQuestionDataset {
  cropId: string;
  cropName: LocalizedText;
  aliases: string[];
  category: "Horticulture" | "Cash Crop" | "Oilseeds" | "Cereals" | "Pulses" | "Vegetables";
  iconEmoji: string;
  bannerGradient: string;
  activities: {
    planting?: CropActivityConfig;
    pesticide?: CropActivityConfig;
    fertilizer?: CropActivityConfig;
    weeding?: CropActivityConfig;
    irrigation?: CropActivityConfig;
    harvesting?: CropActivityConfig;
    sales?: CropActivityConfig;
    other?: CropActivityConfig;
    [key: string]: CropActivityConfig | undefined;
  };
  updatedAt: string;
  updatedBy?: string;
}

// 1. Official Agronomy-Accurate Question Dataset for ONION (कांदा / प्याज)
export const ONION_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "onion",
  cropName: {
    mr: "कांदा",
    hi: "प्याज",
    en: "Onion",
  },
  aliases: ["कांदा", "कांदे", "प्याज", "pyaj", "kanda", "onion", "kande"],
  category: "Horticulture",
  iconEmoji: "🧅",
  bannerGradient: "from-rose-600 via-red-600 to-amber-600",
  activities: {
    planting: {
      title: {
        mr: "कांदा पुनर्लागवड / पेरणी",
        hi: "प्याज रोपाई / बुवाई",
        en: "Onion Transplanting & Sowing",
      },
      icon: "Sprout",
      questions: [
        {
          id: "onion_plant_1",
          key: "variety",
          mr: "कांद्याची कोणती जात लावली? (उदा. भीमा सुपर, भीमा लाल, प्रशांत, गावरान)",
          hi: "प्याज की कौन सी किस्म लगाई? (उदा. भीमा सुपर, भीमा लाल, प्रशांत, गावरान)",
          en: "Which onion variety was planted? (e.g. Bhima Super, Bhima Red, Gavran, Prashant)",
          hint: "भीमा सुपर / भीमा लाल / प्रशांत / एलोरा / गावरान",
          required: true,
        },
        {
          id: "onion_plant_2",
          key: "area_method",
          mr: "किती क्षेत्रावर पुनर्लागवड केली आणि गादीवाफ्यावर (BBF) की सपाट वाफ्यावर?",
          hi: "कितने क्षेत्र में रोपाई की और मेड़ (BBF) पर या सपाट क्यारी में?",
          en: "How much area was transplanted and was it on raised beds (BBF) or flat beds?",
          hint: "उदा. १ एकर गादीवाफा (BBF) / सपाट वाफा",
          required: true,
        },
        {
          id: "onion_plant_3",
          key: "expense_labour",
          mr: "कांदा रोपे आणि लागवड मजुरीचा एकूण खर्च किती झाला?",
          hi: "प्याज की पौध और रोपाई मजदूरी का कुल खर्च कितना हुआ?",
          en: "What was the total cost for onion seedlings and planting labour?",
          hint: "उदा. रोपे ₹८,००० + मजुरी ₹६,००० = ₹१४,०००",
          required: false,
        },
      ],
    },
    pesticide: {
      title: {
        mr: "फवारणी / कीटक व रोग नियंत्रण",
        hi: "छिड़काव / कीट व रोग नियंत्रण",
        en: "Spraying & Pest Control",
      },
      icon: "ShieldAlert",
      questions: [
        {
          id: "onion_pest_1",
          key: "pest_or_disease",
          mr: "कांद्यावर मुख्यत्वे कशासाठी फवारणी केली? (उदा. थ्रिप्स/फुलकिडे, जांभळा करपा, पीळ पडणे किंवा टॉनिक)",
          hi: "प्याज पर मुख्य रूप से किसके लिए छिड़काव किया? (उदा. थ्रिप्स, बैंगनी धब्बा या टॉनिक)",
          en: "What was the primary reason for spraying? (e.g., Thrips, Purple Blotch, Twister disease, or Growth Tonic)",
          hint: "थ्रिप्स (फुलकिडे) / जांभळा करपा / पीळ रोग / टॉनिक",
          required: true,
        },
        {
          id: "onion_pest_2",
          key: "chemical_used",
          mr: "कोणते औषध, बुरशीनाशक किंवा स्टीकर फवारले आणि प्रमाण किती ठेवले?",
          hi: "कौन सी दवा, फफूंदनाशक या स्टीकर का छिड़काव किया और मात्रा क्या रखी?",
          en: "Which pesticide, fungicide or sticker was sprayed and in what dose?",
          hint: "उदा. कराटे + कस्टोडिया + ॲग्रो ८४ स्टीकर",
          required: true,
        },
        {
          id: "onion_pest_3",
          key: "expense_spray",
          mr: "फवारणी औषधे व मजुरीचा एकूण किती खर्च झाला?",
          hi: "छिड़काव की दवाओं और मजदूरी का कुल कितना खर्च हुआ?",
          en: "What was the total expenditure on spray medicines and labour?",
          hint: "उदा. औषध ₹२,२०० + पंप मजुरी ₹६०० = ₹२,८००",
          required: false,
        },
      ],
    },
    fertilizer: {
      title: {
        mr: "खत व्यवस्थापन / सूक्ष्म अन्नद्रव्ये",
        hi: "उर्वरक प्रबंधन व सूक्ष्म पोषक",
        en: "Fertilizer & Micronutrients",
      },
      icon: "Layers",
      questions: [
        {
          id: "onion_fert_1",
          key: "fertilizer_details",
          mr: "कोणते खत दिले? (उदा. १०:२६:२६, डीएपी, गंधक/सल्फर, विद्राव्य खत ००:५२:३४)?",
          hi: "कौन सा खाद दिया? (उदा. 10:26:26, डीएपी, सल्फर, घुलनशील 00:52:34)?",
          en: "Which fertilizer was applied? (e.g. 10:26:26, DAP, Sulphur, 00:52:34)?",
          hint: "१०:२६:२६ / डीएपी / गंधक (सल्फर) / १३:००:४५",
          required: true,
        },
        {
          id: "onion_fert_2",
          key: "application_mode",
          mr: "खत जमिनीत फेकून दिले की ठिबकद्वारे सोडले आणि प्रमाण किती होते?",
          hi: "खाद खेत में बखेर कर दिया या ड्रिप से छोड़ा और मात्रा कितनी थी?",
          en: "Was fertilizer broadcasted in soil or given via drip, and what was the quantity?",
          hint: "उदा. २ गोणी फेकून दिले / ठिबकमधून ५ किलो व्हेंचुरीने",
          required: true,
        },
        {
          id: "onion_fert_3",
          key: "expense_fert",
          mr: "खत खरेदी आणि मजुरीचा एकूण खर्च किती झाला?",
          hi: "खाद खरीद और मजदूरी का कुल खर्च कितना हुआ?",
          en: "What was the total cost of fertilizer purchase and application labour?",
          hint: "उदा. ₹३,५०० खत खरेदी + ₹५०० मजुरी",
          required: false,
        },
      ],
    },
    weeding: {
      title: {
        mr: "खुरपणी / तण नियंत्रण",
        hi: "निराई / खरपतवार नियंत्रण",
        en: "Weeding & Weed Management",
      },
      icon: "Scissors",
      questions: [
        {
          id: "onion_weed_1",
          key: "weed_method",
          mr: "तण नियंत्रण हाताने खुरपणी करून केले की तणनाशक (टरगा सुपर, गोल) फवारले?",
          hi: "खरपतवार नियंत्रण हाथ से निराई करके किया या खरपतवार नाशक (टरगा सुपर, गोल) का छिड़काव किया?",
          en: "Was weeding done manually by hand or by spraying herbicide (Targa Super, Goal)?",
          hint: "हाताने खुरपणी / टरगा सुपर + गोल फवारणी",
          required: true,
        },
        {
          id: "onion_weed_2",
          key: "expense_weeding",
          mr: "खुरपणी मजुरी किंवा तणनाशकाचा एकूण खर्च किती झाला?",
          hi: "निराई मजदूरी या खरपतवार नाशक का कुल खर्च कितना हुआ?",
          en: "What was the total cost of manual weeding labour or herbicide?",
          hint: "उदा. ५ मजूर ₹२,००० किंवा तणनाशक ₹१,२००",
          required: false,
        },
      ],
    },
    irrigation: {
      title: {
        mr: "पाणी देणे / सिंचन",
        hi: "सिंचाई",
        en: "Irrigation & Water Schedule",
      },
      icon: "Droplets",
      questions: [
        {
          id: "onion_irrig_1",
          key: "irrigation_details",
          mr: "कांद्याला पाणी ठिबकने दिले, तुषारने (स्प्रिंकलर) की पाटपाणी सोडले? किती वेळ चालवले?",
          hi: "प्याज को पानी ड्रिप से दिया, स्प्रिंकलर से या खुला पानी दिया? कितने घंटे चलाया?",
          en: "Was onion watered via drip, sprinkler, or flood irrigation? How long did it run?",
          hint: "उदा. ठिबक ३ तास चालवले / तुषार २ तास",
          required: true,
        },
      ],
    },
    harvesting: {
      title: {
        mr: "काढणी व तोडणी",
        hi: "खुदाई व कटाई",
        en: "Harvesting & Curing",
      },
      icon: "PackageCheck",
      questions: [
        {
          id: "onion_harv_1",
          key: "harvest_yield",
          mr: "कांदा काढणी किती क्षेत्राची झाली आणि किती गोणी/क्विंटल माल निघाला?",
          hi: "प्याज की खुदाई कितने क्षेत्र की हुई और कितनी बोरी/क्विंटल उत्पादन निकला?",
          en: "How much area was harvested and how many bags/quintals of onion were produced?",
          hint: "उदा. १ एकरात २०० गोणी (अंदाजे १०० क्विंटल)",
          required: true,
        },
        {
          id: "onion_harv_2",
          key: "harvest_labor_cost",
          mr: "काढणे, पात कापणे आणि गोणी भरण्यासाठी मजुरी किती लागली?",
          hi: "खुदाई, पत्ती कटाई और बोरी भरने में मजदूरी का कितना खर्च लगा?",
          en: "What was the labour cost for harvesting, detopping and bagging?",
          hint: "उदा. उपटणी आणि पात कापणी मजुरी ₹१२,०००",
          required: false,
        },
      ],
    },
    sales: {
      title: {
        mr: "विक्री व बाजारभाव",
        hi: "बिक्री व मंडी भाव",
        en: "Sales & Mandi Realization",
      },
      icon: "Coins",
      questions: [
        {
          id: "onion_sale_1",
          key: "market_and_quantity",
          mr: "कांदा कोणत्या बाजारात/मार्केटला विकला आणि किती क्विंटल किंवा गोणी विकल्या?",
          hi: "प्याज किस मंडी/बाजार में बेचा और कितने क्विंटल या बोरी बेची?",
          en: "Which mandi/market was the onion sold in, and how many quintals or bags were sold?",
          hint: "उदा. लासलगाव / पिंपळगाव मार्केटला ६० गोणी विकल्या",
          required: true,
        },
        {
          id: "onion_sale_2",
          key: "rate_and_revenue",
          mr: "कांद्याला काय भाव मिळाला (प्रति क्विंटल किंवा किलो) आणि एकूण किती रक्कम मिळाली?",
          hi: "प्याज का क्या भाव मिला (प्रति क्विंटल या किलो) और कुल कितनी राशि मिली?",
          en: "What rate did you get per quintal or kg, and what was the total revenue?",
          hint: "उदा. ₹२,२०० प्रति क्विंटल, एकूण पट्टी ₹६६,०००",
          required: true,
        },
        {
          id: "onion_sale_3",
          key: "transport_expense",
          mr: "गाडीभाडे, हमाली आणि तोलाईचा एकूण किती खर्च झाला?",
          hi: "गाड़ी भाड़ा, पल्लेदारी (हमाली) और तौलाई का कुल कितना खर्च हुआ?",
          en: "What was the total expense for transport, porterage (hamali) and weighing?",
          hint: "उदा. भाडे ₹२,५०० + हमाली/तोलाई ₹८०० = ₹३,३००",
          required: false,
        },
      ],
    },
    other: {
      title: {
        mr: "इतर कामे",
        hi: "अन्य कार्य",
        en: "Other Activities",
      },
      icon: "Clipboard",
      questions: [
        {
          id: "onion_other_1",
          key: "general_work",
          mr: "कांद्याशी संबंधित कोणते काम केले व किती खर्च आला?",
          hi: "प्याज से संबंधित कौन सा कार्य किया और कितना खर्च हुआ?",
          en: "What onion-related work was performed and what was the cost?",
          hint: "उदा. चाळीमध्ये साठवणूक / ग्रेडिंग काम",
          required: false,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// 2. COTTON (कापूस / कपास)
export const COTTON_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "cotton",
  cropName: {
    mr: "कापूस",
    hi: "कपास",
    en: "Cotton",
  },
  aliases: ["कापूस", "कपास", "kapas", "cotton", "kapus"],
  category: "Cash Crop",
  iconEmoji: "☁️",
  bannerGradient: "from-sky-600 via-blue-600 to-indigo-600",
  activities: {
    planting: {
      title: { mr: "कापूस पेरणी / टोकण", hi: "कपास बुवाई", en: "Cotton Sowing" },
      icon: "Sprout",
      questions: [
        {
          id: "cotton_plant_1",
          key: "variety",
          mr: "कापसाचे कोणते वाण लावले? (उदा. राशी ६५९, अजित १५५, जादू, अंकुर)?",
          hi: "कपास की कौन सी किस्म लगाई? (उदा. राशी 659, अजित 155, जादू)?",
          en: "Which cotton hybrid was sown? (e.g. Rasi 659, Ajit 155, Jadoo)?",
          hint: "राशी ६५९ / अजित १५५ / जादू",
          required: true,
        },
        {
          id: "cotton_plant_2",
          key: "spacing_method",
          mr: "दोन ओळीत आणि रोपांत अंतर किती ठेवले आणि किती पाकिटे पेरली?",
          hi: "पंक्ति और पौधे की दूरी कितनी रखी और कितने पैकेट बोए?",
          en: "What was row-to-plant spacing and how many seed packets were used?",
          hint: "उदा. ४x१.५ फूट अंतर, २ पाकिटे",
          required: true,
        },
        {
          id: "cotton_plant_3",
          key: "sowing_cost",
          mr: "बियाणे आणि टोकण मजुरीचा एकूण खर्च किती झाला?",
          hi: "बीज और बुवाई मजदूरी का कुल खर्च कितना हुआ?",
          en: "What was the total cost for cotton seed packets and labour?",
          hint: "उदा. बियाणे ₹१,८०० + मजुरी ₹१,२००",
          required: false,
        },
      ],
    },
    pesticide: {
      title: { mr: "फवारणी / बोंडअळी व कीड नियंत्रण", hi: "छिड़काव / गुलाबी सुंडी व कीट नियंत्रण", en: "Spraying & Bollworm Management" },
      icon: "ShieldAlert",
      questions: [
        {
          id: "cotton_pest_1",
          key: "pest_target",
          mr: "कापसावर मुख्यत्वे कशासाठी फवारणी केली? (उदा. गुलाबी बोंडअळी, रसशोषक कीड - मावा/तुडतुडे, बुरशी किंवा पातगळ थांबवणे)?",
          hi: "कपास पर मुख्य रूप से किसके लिए छिड़काव किया? (गुलाबी सुंडी, रस चूसक कीट, या फूल-पत्ती गिरना रोकने)?",
          en: "What was the target issue? (e.g., Pink bollworm, sucking pests - aphids/jassids, boll drop)?",
          hint: "गुलाबी बोंडअळी / रसशोषक कीड / पातगळ",
          required: true,
        },
        {
          id: "cotton_pest_2",
          key: "chemicals",
          mr: "कोणते कीटकनाशक किंवा टॉनिक वापरले आणि प्रमाण काय ठेवले?",
          hi: "कौन सा कीटनाशक या टॉनिक इस्तेमाल किया और मात्रा क्या रखी?",
          en: "Which pesticide or tonic was sprayed and in what proportion?",
          hint: "उदा. प्रोक्लेम + उलाला + प्लानोफिक्स",
          required: true,
        },
        {
          id: "cotton_pest_3",
          key: "spray_cost",
          mr: "फवारणी औषधे आणि पंपाच्या मजुरीचा एकूण खर्च किती झाला?",
          hi: "छिड़काव दवा और मजदूरी का कुल खर्च कितना हुआ?",
          en: "What was the total spraying expense including labour?",
          hint: "उदा. ₹२,४०० औषध + ₹८०० मजुरी",
          required: false,
        },
      ],
    },
    fertilizer: {
      title: { mr: "खत व्यवस्थापन", hi: "उर्वरक प्रबंधन", en: "Fertilizer Schedule" },
      icon: "Layers",
      questions: [
        {
          id: "cotton_fert_1",
          key: "fertilizer_type",
          mr: "कोणते खत दिले? (उदा. १०:२६:२६, डीएपी, युरिया टॉप ड्रेसिंग की मॅग्नेशियम सल्फेट)?",
          hi: "कौन सा खाद दिया? (उदा. 10:26:26, डीएपी, यूरिया टॉप ड्रेसिंग या मैग्नीशियम सल्फेट)?",
          en: "Which fertilizer was given? (e.g. 10:26:26, DAP, Urea top-dressing, Magnesium sulphate)?",
          hint: "१०:२६:२६ / युरिया / मॅग्नेशियम सल्फेट",
          required: true,
        },
        {
          id: "cotton_fert_2",
          key: "fert_cost",
          mr: "खताची खरेदी आणि रिंग पद्धतीने टाकण्याची मजुरी किती झाली?",
          hi: "खाद खरीद और डालने की मजदूरी कितनी हुई?",
          en: "What was the fertilizer purchase and application cost?",
          hint: "उदा. खत ₹३,२०० + मजुरी ₹६००",
          required: false,
        },
      ],
    },
    weeding: {
      title: { mr: "कोळपणी व खुरपणी", hi: "गुड़ाई व निराई", en: "Intercultivation & Weeding" },
      icon: "Scissors",
      questions: [
        {
          id: "cotton_weed_1",
          key: "weeding_mode",
          mr: "बैलजोडीने कोळपणी केली, ट्रॅक्टरने की मजुरांकडून खुरपणी करून घेतली?",
          hi: "बैलों से गुड़ाई की, ट्रैक्टर से या मजदूरों से निराई करवाई?",
          en: "Was intercultivation done by bullock drawn hoe, mini tractor, or manual weeding?",
          hint: "बैलजोडी कोळपणी / मजुरांकडून खुरपणी",
          required: true,
        },
        {
          id: "cotton_weed_2",
          key: "weeding_expense",
          mr: "कोळपणी किंवा खुरपणीचा एकूण किती खर्च झाला?",
          hi: "गुड़ाई या निराई का कुल कितना खर्च हुआ?",
          en: "What was the total expenditure for intercultivation/weeding?",
          hint: "उदा. २ कोळपण्या ₹१,२०० + मजुरी ₹१,५००",
          required: false,
        },
      ],
    },
    irrigation: {
      title: { mr: "सिंचन व्यवस्थापन", hi: "सिंचाई", en: "Irrigation" },
      icon: "Droplets",
      questions: [
        {
          id: "cotton_irrig_1",
          key: "irrigation_details",
          mr: "कापसाला ठिबकने पाणी दिले की सऱ्यांमधून पाटपाणी सोडले?",
          hi: "कपास को ड्रिप से पानी दिया या क्यारी में खुला पानी दिया?",
          en: "Was cotton irrigated through drip line or furrow irrigation?",
          hint: "ठिबक सिंचन / सरीने पाटपाणी",
          required: true,
        },
      ],
    },
    harvesting: {
      title: { mr: "कापूस वेचणी (तोडणी)", hi: "कपास चुगाई", en: "Cotton Picking" },
      icon: "PackageCheck",
      questions: [
        {
          id: "cotton_pick_1",
          key: "pick_round_yield",
          mr: "कापसाची कितवी वेचणी केली आणि किती क्विंटल कापूस निघाला?",
          hi: "कपास की कौन सी चुगाई की और कितना क्विंटल कपास निकला?",
          en: "Which picking round was this (1st/2nd/3rd) and what was the yield in quintals?",
          hint: "उदा. पहिली वेचणी, ८ क्विंटल कापूस",
          required: true,
        },
        {
          id: "cotton_pick_2",
          key: "picking_labour",
          mr: "वेचणी मजुरीचा दर प्रति किलो किती दिला आणि एकूण वेचणी खर्च किती झाला?",
          hi: "चुगाई मजदूरी की दर प्रति किलो क्या दी और कुल कितना खर्च आया?",
          en: "What was the picking labour rate per kg and the total picking expense?",
          hint: "उदा. ₹१० प्रति किलो दराने एकूण ₹८,००० मजुरी",
          required: false,
        },
      ],
    },
    sales: {
      title: { mr: "कापूस विक्री व हमीभाव", hi: "कपास बिक्री व मंडी दर", en: "Cotton Sales & Mandi Rates" },
      icon: "Coins",
      questions: [
        {
          id: "cotton_sale_1",
          key: "sale_details",
          mr: "कापूस सीसीआय (CCI), जिनिंग फॅक्टरी की स्थानिक व्यापाऱ्याला किती क्विंटल विकला?",
          hi: "कपास सीसीआई (CCI), जिनिंग या स्थानीय व्यापारी को कितने क्विंटल बेचा?",
          en: "Was cotton sold to CCI, ginning mill or local trader, and in what quantity?",
          hint: "उदा. जिनिंग फॅक्टरीला १२ क्विंटल कापूस",
          required: true,
        },
        {
          id: "cotton_sale_2",
          key: "rate_and_amount",
          mr: "कापसाला प्रति क्विंटल काय भाव मिळाला आणि एकूण किती रुपये पट्टी झाली?",
          hi: "कपास का प्रति क्विंटल क्या भाव मिला और कुल कितनी राशि मिली?",
          en: "What rate per quintal was fetched and what was the total billing amount?",
          hint: "उदा. ₹७,४०० प्रति क्विंटल, एकूण ₹८८,८००",
          required: true,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// 3. SOYBEAN (सोयाबीन)
export const SOYBEAN_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "soybean",
  cropName: {
    mr: "सोयाबीन",
    hi: "सोयाबीन",
    en: "Soybean",
  },
  aliases: ["सोयाबीन", "सोयाबिन", "soyabean", "soybean", "soya"],
  category: "Oilseeds",
  iconEmoji: "🌱",
  bannerGradient: "from-emerald-600 via-teal-600 to-green-700",
  activities: {
    planting: {
      title: { mr: "सोयाबीन पेरणी / टोकण", hi: "सोयाबीन बुवाई", en: "Soybean Sowing" },
      icon: "Sprout",
      questions: [
        {
          id: "soya_plant_1",
          key: "variety",
          mr: "सोयाबीनचे कोणते वाण वापरले? (उदा. जेएस ३३५, ९३०५, फुले संगम, फुले किमया)?",
          hi: "सोयाबीन की कौन सी किस्म लगाई? (उदा. जेएस 335, फुले संगम, फुले किमया)?",
          en: "Which soybean variety was used? (e.g. JS 335, Phule Sangam, Phule Kimaya)?",
          hint: "फुले संगम / जेएस ३३५ / ९३०५",
          required: true,
        },
        {
          id: "soya_plant_2",
          key: "seed_treatment_cost",
          mr: "बीजप्रक्रिया केली होती का? आणि बियाणे व पेरणी यंत्राचा एकूण खर्च किती झाला?",
          hi: "क्या बीज उपचार किया था? और बीज तथा बुवाई का कुल खर्च कितना हुआ?",
          en: "Was seed treatment done? What was total cost for seed and sowing machinery?",
          hint: "उदा. ट्रायकोडर्मा बीजप्रक्रिया, बियाणे ₹३,५०० + ट्रॅक्टर ₹१,०००",
          required: false,
        },
      ],
    },
    pesticide: {
      title: { mr: "फवारणी / चक्रीभुंगा व शेंग अळी नियंत्रण", hi: "छिड़काव / गर्डल बीटल व इल्ली नियंत्रण", en: "Spraying & Pod Borer Control" },
      icon: "ShieldAlert",
      questions: [
        {
          id: "soya_pest_1",
          key: "pest_target",
          mr: "सोयाबीनवर कशासाठी फवारणी केली? (उदा. चक्रीभुंगा, खोडकीड, पाने खाणारी अळी किंवा शेंग अळी)?",
          hi: "सोयाबीन पर किसके लिए छिड़काव किया? (उदा. गर्डल बीटल, तना मक्खी, या इल्ली)?",
          en: "What pest was targeted? (e.g. Girdle beetle, Stem fly, Spodoptera, or Pod borer)?",
          hint: "चक्रीभुंगा / खोडकीड / शेंग पोखरणाऱ्या अळ्या",
          required: true,
        },
        {
          id: "soya_pest_2",
          key: "chemical_and_cost",
          mr: "कोणते कीटकनाशक फवारले आणि औषध व मजुरीचा एकूण खर्च किती झाला?",
          hi: "कौन सा कीटनाशक छिड़का और दवा तथा मजदूरी का कुल खर्च कितना हुआ?",
          en: "Which insecticide was sprayed and what was the total expenditure?",
          hint: "उदा. कोराजन + ०:५२:३४, एकूण ₹१,९००",
          required: true,
        },
      ],
    },
    fertilizer: {
      title: { mr: "खत व्यवस्थापन", hi: "उर्वरक प्रबंधन", en: "Fertilizer Application" },
      icon: "Layers",
      questions: [
        {
          id: "soya_fert_1",
          key: "fertilizer_used",
          mr: "पेरणीवेळी किंवा नंतर कोणते खत दिले? (उदा. सिंगल सुपर फॉस्फेट SSP, १०:२६:२६, गंधक)?",
          hi: "बुवाई के समय या बाद में कौन सा खाद दिया? (उदा. एसएसपी, 10:26:26, सल्फर)?",
          en: "Which fertilizer was applied? (e.g. SSP, 10:26:26, Sulphur)?",
          hint: "सिंगल सुपर फॉस्फेट (SSP) + गंधक",
          required: true,
        },
      ],
    },
    weeding: {
      title: { mr: "तणनाशक फवारणी व खुरपणी", hi: "खरपतवार नाशक व निराई", en: "Weedicide & Manual Weeding" },
      icon: "Scissors",
      questions: [
        {
          id: "soya_weed_1",
          key: "weedicide_details",
          mr: "सोयाबीनमध्ये कोणते तणनाशक फवारले? (उदा. परसूट, ओडिसी, शॅकेड) आणि खर्च किती झाला?",
          hi: "सोयाबीन में कौन सा खरपतवार नाशक छिड़का? (उदा. परसूट, शॅकेड, आइरिस) और खर्च कितना हुआ?",
          en: "Which post-emergence herbicide was sprayed? (e.g. Pursuit, Odyssey, Shaked) and cost?",
          hint: "शॅकेड + परसूट, एकूण खर्च ₹१,४००",
          required: true,
        },
      ],
    },
    harvesting: {
      title: { mr: "काढणी व मळणी (थ्रेशिंग)", hi: "कटाई व थ्रेशिंग", en: "Harvesting & Threshing" },
      icon: "PackageCheck",
      questions: [
        {
          id: "soya_harv_1",
          key: "yield_and_machinery",
          mr: "सोयाबीन हार्वेस्टरने काढले की मजुरांनी? किती क्विंटल उत्पादन मिळाले?",
          hi: "सोयाबीन कंबाइन हार्वेस्टर से काटा या मजदूरों से? कितना क्विंटल उत्पादन मिला?",
          en: "Was harvesting done via combine or manual labor, and what was the quintal yield?",
          hint: "उदा. कंबाईन हार्वेस्टर, १ एकरात ११ क्विंटल उत्पादन",
          required: true,
        },
        {
          id: "soya_harv_2",
          key: "harvest_cost",
          mr: "हार्वेस्टर किंवा मजुरी आणि मळणीचा एकूण किती खर्च झाला?",
          hi: "हार्वेस्टर या मजदूरी और थ्रेशिंग का कुल कितना खर्च हुआ?",
          en: "What was the total expenditure for harvesting, hauling and threshing?",
          hint: "उदा. कंबाईन हार्वेस्टर ₹२,२०० प्रति एकर",
          required: false,
        },
      ],
    },
    sales: {
      title: { mr: "सोयाबीन विक्री", hi: "सोयाबीन बिक्री", en: "Soybean Sales" },
      icon: "Coins",
      questions: [
        {
          id: "soya_sale_1",
          key: "rate_and_market",
          mr: "सोयाबीन कोणत्या मार्केटमध्ये विकले, काय भाव मिळाला आणि एकूण रक्कम किती झाली?",
          hi: "सोयाबीन किस मंडी में बेचा, क्या भाव मिला और कुल राशि कितनी बनी?",
          en: "Which mandi was soybean sold in, what was the price per quintal, and total revenue?",
          hint: "उदा. अकोला मंडी, ₹४,४५० भाव, १० क्विंटल = ₹४४,५००",
          required: true,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// 4. SUGARCANE (ऊस / गन्ना)
export const SUGARCANE_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "sugarcane",
  cropName: {
    mr: "ऊस",
    hi: "गन्ना",
    en: "Sugarcane",
  },
  aliases: ["ऊस", "गन्ना", "ganna", "oos", "sugarcane"],
  category: "Cash Crop",
  iconEmoji: "🎋",
  bannerGradient: "from-lime-600 via-green-600 to-emerald-700",
  activities: {
    planting: {
      title: { mr: "ऊस लागवड / बेणे रोपण", hi: "गन्ना बुवाई", en: "Sugarcane Planting" },
      icon: "Sprout",
      questions: [
        {
          id: "cane_plant_1",
          key: "variety",
          mr: "उसाची कोणती जात लावली? (उदा. को ८६०३२, को ०२६५, १०००१, फुले ०९०५७)?",
          hi: "गन्ने की कौन सी किस्म लगाई? (उदा. को 86032, को 0265, 10001)?",
          en: "Which sugarcane variety was planted? (e.g. Co 86032, Co 0265, 10001)?",
          hint: "को ८६०३२ / को ०२६५ / १०००१",
          required: true,
        },
        {
          id: "cane_plant_2",
          key: "method_and_spacing",
          mr: "सरीचे अंतर किती ठेवले आणि एक डोळा की दोन डोळा बेणे वापरले?",
          hi: "क्यारी की दूरी क्या रखी और एक आंख या दो आंख का बीज इस्तेमाल किया?",
          en: "What was furrow row spacing (4ft/5ft) and was single-bud or double-bud sett used?",
          hint: "उदा. ५ फूट सरी, एक डोळा रोप लागवड",
          required: true,
        },
      ],
    },
    fertilizer: {
      title: { mr: "खत व्यवस्थापन / बाळबांधणी डोस", hi: "उर्वरक प्रबंधन", en: "Fertilizer & Earthing Dose" },
      icon: "Layers",
      questions: [
        {
          id: "cane_fert_1",
          key: "fertilizer_details",
          mr: "उसाला बेसल डोस किंवा बाळबांधणीवेळी कोणते खत दिले आणि खर्च किती झाला?",
          hi: "गन्ने को बेसल डोज या मिट्टी चढ़ाते समय कौन सा खाद दिया और खर्च कितना हुआ?",
          en: "What basal or earthing-up fertilizer was given and what was the cost?",
          hint: "उदा. डीएपी + पोटॅश + युरिया + गंधक, एकूण ₹६,०००",
          required: true,
        },
      ],
    },
    harvesting: {
      title: { mr: "ऊस तोडणी व साखर कारखाना वजन", hi: "गन्ना कटाई व मिल वजन", en: "Sugarcane Cutting & Mill Delivery" },
      icon: "PackageCheck",
      questions: [
        {
          id: "cane_harv_1",
          key: "cutting_and_mill",
          mr: "ऊस कोणत्या साखर कारखान्याला गेला आणि किती टन वजन निघाले?",
          hi: "गन्ना किस चीनी मिल को भेजा और कुल कितना टन वजन हुआ?",
          en: "Which sugar factory was the sugarcane supplied to and what was the tonnage?",
          hint: "उदा. सोमेश्वर साखर कारखाना, ६५ टन वजन",
          required: true,
        },
      ],
    },
    sales: {
      title: { mr: "ऊस बिल / एफआरपी (FRP) पेमेंट", hi: "गन्ना भुगतान (FRP)", en: "Sugar Mill FRP Payment" },
      icon: "Coins",
      questions: [
        {
          id: "cane_sale_1",
          key: "frp_rate_amount",
          mr: "कारखान्याकडून उसाला काय दर मिळाला (प्रति टन) आणि एकूण किती बिल जमा झाले?",
          hi: "मिल से गन्ने का प्रति टन क्या भाव मिला और कुल कितना भुगतान आया?",
          en: "What was the FRP rate per ton and the total bill deposited in bank?",
          hint: "उदा. ₹३,१५० प्रति टन, ६५ टन = ₹२,०४,७५०",
          required: true,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// 5. TOMATO (टोमॅटो / टमाटर)
export const TOMATO_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "tomato",
  cropName: {
    mr: "टोमॅटो",
    hi: "टमाटर",
    en: "Tomato",
  },
  aliases: ["टोमॅटो", "टमाटर", "tamatar", "tomato"],
  category: "Vegetables",
  iconEmoji: "🍅",
  bannerGradient: "from-rose-500 via-red-600 to-amber-600",
  activities: {
    planting: {
      title: { mr: "टोमॅटो पुनर्लागवड", hi: "टमाटर रोपाई", en: "Tomato Transplanting" },
      icon: "Sprout",
      questions: [
        {
          id: "tom_plant_1",
          key: "variety",
          mr: "टोमॅटोची कोणती जात लावली? (उदा. साहो, अभिनव, सिजेंटा १०५७, ऋषी)?",
          hi: "टमाटर की कौन सी किस्म लगाई? (उदा. साहो, अभिनव, सिंजेंटा 1057)?",
          en: "Which tomato hybrid was planted? (e.g. Saaho, Abhinav, Syngenta 1057)?",
          hint: "साहो / अभिनव / १०५७",
          required: true,
        },
      ],
    },
    pesticide: {
      title: { mr: "फवारणी / नागअळी व करपा नियंत्रण", hi: "छिड़काव / लीफ माइनर व झुलसा नियंत्रण", en: "Spraying & Blight Control" },
      icon: "ShieldAlert",
      questions: [
        {
          id: "tom_pest_1",
          key: "pest_target",
          mr: "टोमॅटोवर कशासाठी फवारणी केली? (उदा. नागअळी, फळपोखरणारी अळी, करपा किंवा व्हायरस)?",
          hi: "टमाटर पर किसके लिए छिड़काव किया? (उदा. लीफ माइनर, फल छेदक इल्ली, झुलसा या वायरस)?",
          en: "What was the target pest/disease? (e.g. Leaf miner, fruit borer, early/late blight, leaf curl virus)?",
          hint: "नागअळी / करपा / फळपोखरणारी अळी",
          required: true,
        },
      ],
    },
    harvesting: {
      title: { mr: "तोडणी व कॅरेट उत्पादन", hi: "तुड़ाई व क्रेट उत्पादन", en: "Plucking & Crates Harvest" },
      icon: "PackageCheck",
      questions: [
        {
          id: "tom_harv_1",
          key: "crates_harvested",
          mr: "टोमॅटोची कितवी तोड झाली आणि किती कॅरेट माल निघाला?",
          hi: "टमाटर की कौन सी तुड़ाई हुई और कितने क्रेट माल निकला?",
          en: "Which plucking round was this and how many crates were harvested?",
          hint: "उदा. तिसरी तोडणी, १२० कॅरेट",
          required: true,
        },
      ],
    },
    sales: {
      title: { mr: "टोमॅटो मार्केट विक्री", hi: "टमाटर मंडी बिक्री", en: "Tomato Mandi Realization" },
      icon: "Coins",
      questions: [
        {
          id: "tom_sale_1",
          key: "crate_rate",
          mr: "टोमॅटो कोणत्या मार्केटला नेला आणि प्रति कॅरेट काय भाव मिळाला?",
          hi: "टमाटर किस मंडी ले गए और प्रति क्रेट क्या भाव मिला?",
          en: "Which mandi was tomato sold in and what was the rate per crate?",
          hint: "उदा. नारायणगाव मार्केट, ₹५५० प्रति कॅरेट",
          required: true,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// 6. WHEAT (गहू / गेहूं)
export const WHEAT_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "wheat",
  cropName: {
    mr: "गहू",
    hi: "गेहूं",
    en: "Wheat",
  },
  aliases: ["गहू", "गेहूं", "gehu", "wheat", "gahu"],
  category: "Cereals",
  iconEmoji: "🌾",
  bannerGradient: "from-amber-500 via-yellow-600 to-amber-700",
  activities: {
    planting: {
      title: { mr: "गहू पेरणी", hi: "गेहूं बुवाई", en: "Wheat Sowing" },
      icon: "Sprout",
      questions: [
        {
          id: "wheat_plant_1",
          key: "variety",
          mr: "गव्हाचे कोणते वाण वापरले? (उदा. लोकवन, समाधान, २१८९, शरबती)?",
          hi: "गेहूं की कौन सी किस्म लगाई? (उदा. लोकवन, समाधान, शरबती)?",
          en: "Which wheat variety was sown? (e.g. Lokwan, Samadhan, 2189, Sharbati)?",
          hint: "लोकवन / समाधान / २१८९",
          required: true,
        },
      ],
    },
    irrigation: {
      title: { mr: "पाणी पाळी (CRI अवस्था)", hi: "सिंचाई", en: "Critical Growth Irrigation" },
      icon: "Droplets",
      questions: [
        {
          id: "wheat_irrig_1",
          key: "irrigation_stage",
          mr: "गव्हाला कितवे पाणी दिले? (उदा. मुकुटमुळे फुटताना CRI, कांडी भरताना किंवा ओंबी भरताना)?",
          hi: "गेहूं को कौन सी सिंचाई दी? (उदा. कल्ले फूटते समय, गांठ बनते समय या बालियां भरते समय)?",
          en: "Which irrigation round was given? (e.g. Crown Root Initiation, Jointing, Flowering or Grain Filling)?",
          hint: "मुकुटमुळे फुटताना (CRI) / ओंबी भरताना",
          required: true,
        },
      ],
    },
    harvesting: {
      title: { mr: "कापणी व मळणी", hi: "कटाई व थ्रेशिंग", en: "Harvest & Threshing" },
      icon: "PackageCheck",
      questions: [
        {
          id: "wheat_harv_1",
          key: "bags_yield",
          mr: "गहू काढणी हार्वेस्टरने केली की मजुरांनी? किती क्विंटल/गोणी उत्पादन झाले?",
          hi: "गेहूं की कटाई कंबाइन से की या मजदूरों से? कितना क्विंटल/बोरी उत्पादन हुआ?",
          en: "Was wheat harvested by combine or manual cutters? How many quintals/bags were harvested?",
          hint: "उदा. कंबाईन हार्वेस्टर, २५ गोणी (१५ क्विंटल)",
          required: true,
        },
      ],
    },
    sales: {
      title: { mr: "गहू विक्री व दर", hi: "गेहूं बिक्री", en: "Wheat Sales & MSP" },
      icon: "Coins",
      questions: [
        {
          id: "wheat_sale_1",
          key: "rate_and_amount",
          mr: "गहू घरगुती साठवला की विकला? विकला असल्यास काय भाव मिळाला?",
          hi: "गेहूं घरेलू इस्तेमाल के लिए रखा या बेचा? बेचा तो क्या भाव मिला?",
          en: "Was wheat stored for domestic consumption or sold in mandi? If sold, what rate was obtained?",
          hint: "उदा. १० क्विंटल विक्री, ₹२,५०० प्रति क्विंटल",
          required: true,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// 7. GRAM / CHANA (हरभरा / चना)
export const GRAM_QUESTIONS_DATASET: CropQuestionDataset = {
  cropId: "chana",
  cropName: {
    mr: "हरभरा / चना",
    hi: "चना",
    en: "Gram (Chana)",
  },
  aliases: ["हरभरा", "चना", "chana", "harbhara", "gram"],
  category: "Pulses",
  iconEmoji: "🧆",
  bannerGradient: "from-amber-600 via-orange-600 to-yellow-700",
  activities: {
    planting: {
      title: { mr: "हरभरा पेरणी", hi: "चना बुवाई", en: "Gram Sowing" },
      icon: "Sprout",
      questions: [
        {
          id: "chana_plant_1",
          key: "variety",
          mr: "हरभऱ्याची कोणती जात पेरली? (उदा. विजय, दिग्विजय, जॅकी ९२१८, विशाल डॉलर)?",
          hi: "चने की कौन सी किस्म बोई? (उदा. विजय, दिग्विजय, जैकी 9218, डॉलर)?",
          en: "Which gram variety was sown? (e.g. Vijay, Digvijay, JAKI 9218, Dollar Chana)?",
          hint: "विजय / दिग्विजय / जॅकी ९२१८",
          required: true,
        },
      ],
    },
    pesticide: {
      title: { mr: "घाटे अळी नियंत्रण फवारणी", hi: "घाटी इल्ली नियंत्रण छिड़काव", en: "Pod Borer (Helicoverpa) Spraying" },
      icon: "ShieldAlert",
      questions: [
        {
          id: "chana_pest_1",
          key: "chemical_and_cost",
          mr: "घाटे अळीसाठी कोणते औषध फवारले आणि एकूण खर्च किती झाला?",
          hi: "घाटी इल्ली के लिए कौन सी दवा का छिड़काव किया और कुल कितना खर्च हुआ?",
          en: "Which insecticide was sprayed for pod borer and what was the cost?",
          hint: "उदा. एम्पलीगो / इमामेक्टिन बेन्झोएट, एकूण ₹१,६००",
          required: true,
        },
      ],
    },
    harvesting: {
      title: { mr: "काढणी व मळणी", hi: "कटाई व थ्रेशिंग", en: "Harvest & Threshing" },
      icon: "PackageCheck",
      questions: [
        {
          id: "chana_harv_1",
          key: "yield",
          mr: "हरभरा उपटून थ्रेशरने काढला का? किती क्विंटल उत्पादन मिळाले?",
          hi: "चना थ्रेशर से निकाला या मजदूरों से? कितना क्विंटल उत्पादन मिला?",
          en: "Was gram threshed by machine? What was the yield in quintals?",
          hint: "उदा. थ्रेशरने काढणी, ८ क्विंटल उतारा",
          required: true,
        },
      ],
    },
    sales: {
      title: { mr: "हरभरा हमीभाव विक्री", hi: "चना बिक्री", en: "Gram Sales & Realization" },
      icon: "Coins",
      questions: [
        {
          id: "chana_sale_1",
          key: "sale_rate",
          mr: "हरभरा शासकीय हमीभाव केंद्रावर विकला की बाजारात आणि काय भाव मिळाला?",
          hi: "चना सरकारी समर्थन मूल्य (MSP) केंद्र पर बेचा या मंडी में और क्या भाव मिला?",
          en: "Was gram sold at government MSP center or private mandi, and at what rate?",
          hint: "उदा. हमीभाव केंद्र, ₹५,४४० प्रति क्विंटल",
          required: true,
        },
      ],
    },
  },
  updatedAt: "2026-10-15T22:00:00.000Z",
  updatedBy: "KrushiAR Agronomy Team",
};

// Single Question Dataset: Which plant/crop are you planting?
export const WHICH_PLANT_QUESTION_DATASET: CropQuestionDataset = {
  cropId: "crop_planting",
  cropName: {
    mr: "रोप / पीक लागवड",
    hi: "पौधा / फसल रोपाई",
    en: "Plant / Crop Sowing",
  },
  aliases: ["plant", "planting", "रोप", "झाड", "पीक", "लागवड", "पेरणी", "पौधा", "crop", "sowing", "plantation"],
  category: "Horticulture",
  iconEmoji: "🌱",
  bannerGradient: "from-emerald-600 via-teal-600 to-green-700",
  activities: {
    planting: {
      title: {
        mr: "लागवड / पेरणी",
        hi: "रोपाई / बुवाई",
        en: "Planting / Sowing",
      },
      icon: "Sprout",
      questions: [
        {
          id: "planting_which_plant_1",
          key: "plant_name",
          mr: "तुम्ही कोणते रोप किंवा पीक लावत आहात?",
          hi: "आप कौन सा पौधा या फसल लगा रहे हैं?",
          en: "Which plant are you planting?",
          hint: "उदा. टोमॅटो, मिरची, वांगी, केळी, डाळिंब किंवा इतर रोप",
          required: true,
        },
        {
          id: "planting_variety_2",
          key: "variety",
          mr: "कोणती जात लावली?",
          hi: "कौन सी किस्म लगाई?",
          en: "Which variety?",
          hint: "उदा. संकरित जात / गावरान / व्हरायटी नाव",
          required: true,
        },
        {
          id: "planting_acres_3",
          key: "acres",
          mr: "किती एकर क्षेत्रात लागवड केली?",
          hi: "कितने एकड़ में रोपाई / बुवाई की?",
          en: "How many acres?",
          hint: "उदा. १ एकर / २ एकर / अर्धा एकर",
          required: true,
        },
      ],
    },
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "Crop AI Voice Engine",
};

// All Default Crops Catalog - Emptied so users can upload their own custom JSON
export const DEFAULT_CROP_DATASETS: Record<string, CropQuestionDataset> = {};

export const CROP_LIST_SUMMARY: Array<{
  id: string;
  nameMr: string;
  nameHi: string;
  nameEn: string;
  emoji: string;
  category: string;
  isPrimary?: boolean;
}> = [];

// Sample Crop Question JSON template for user reference and download
export const SAMPLE_CROP_JSON_TEMPLATE: CropQuestionDataset = {
  cropId: "custom_crop",
  cropName: {
    mr: "पिकाचे नाव",
    hi: "फसल का नाम",
    en: "Crop Name",
  },
  aliases: ["नाव", "crop"],
  category: "Horticulture",
  iconEmoji: "🌱",
  bannerGradient: "from-emerald-600 via-teal-600 to-cyan-700",
  activities: {
    planting: {
      title: {
        mr: "लागवड / पेरणी",
        hi: "रोपाई / बुवाई",
        en: "Planting / Sowing",
      },
      icon: "Sprout",
      questions: [
        {
          id: "q_plant_1",
          key: "variety",
          mr: "कोणती जात लावली?",
          hi: "कौन सी किस्म लगाई?",
          en: "Which variety was planted?",
          hint: "उदा. संकरित जात",
          required: true,
        },
        {
          id: "q_plant_2",
          key: "area",
          mr: "किती क्षेत्रावर लागवड केली?",
          hi: "कितने क्षेत्र में रोपाई की?",
          en: "How much area was planted?",
          hint: "उदा. २ एकर",
          required: true,
        },
      ],
    },
    pesticide: {
      title: {
        mr: "फवारणी",
        hi: "छिड़काव",
        en: "Spraying",
      },
      icon: "ShieldAlert",
      questions: [
        {
          id: "q_pest_1",
          key: "chemical_name",
          mr: "कोणते औषध फवारले आणि खर्च किती झाला?",
          hi: "कौन सी दवा का छिड़काव किया और कितना खर्च हुआ?",
          en: "Which pesticide was sprayed and what was the cost?",
          hint: "उदा. औषध नाव, एकूण ₹१,२००",
          required: true,
        },
      ],
    },
  },
  updatedAt: new Date().toISOString(),
  updatedBy: "Custom Uploader",
};
