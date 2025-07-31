import mongoose from "mongoose";
import dotenv from "dotenv";
import TriviaQuestion from "./models/TriviaQuestion.js";

dotenv.config();

const MONGO_URI =
  "mongodb+srv://talktalknigeria:Young6ix@cluster0.rtljvsk.mongodb.net/triviadb"; // or use process.env.MONGO_URI

const questions = [
  {
    question: "What is the capital of Nigeria?",
    options: ["Lagos", "Abuja", "Kano", "Enugu"],
    correctAnswer: "Abuja",
    category: "Geography",
  },
  {
    question: "Who was Nigeria's first president?",
    options: [
      "Nnamdi Azikiwe",
      "Olusegun Obasanjo",
      "Goodluck Jonathan",
      "Yakubu Gowon",
    ],
    correctAnswer: "Nnamdi Azikiwe",
    category: "History",
  },
  {
    question: "In what year did Nigeria gain independence?",
    options: ["1960", "1956", "1963", "1970"],
    correctAnswer: "1960",
    category: "History",
  },
  {
    question: "Which is Nigeria’s most populous city?",
    options: ["Kano", "Ibadan", "Lagos", "Port Harcourt"],
    correctAnswer: "Lagos",
    category: "Geography",
  },
  {
    question: "What is the official language of Nigeria?",
    options: ["Igbo", "Yoruba", "English", "Hausa"],
    correctAnswer: "English",
    category: "Culture",
  },
  {
    question: "Which river is the longest in Nigeria?",
    options: ["River Benue", "River Ogun", "River Niger", "River Osun"],
    correctAnswer: "River Niger",
    category: "Geography",
  },
  {
    question: "Which currency is used in Nigeria?",
    options: ["Dollar", "Naira", "Cedi", "Shilling"],
    correctAnswer: "Naira",
    category: "General Knowledge",
  },
  {
    question: "What is Nigeria’s international dialing code?",
    options: ["+256", "+234", "+233", "+221"],
    correctAnswer: "+234",
    category: "General Knowledge",
  },
  {
    question: "How many states does Nigeria have?",
    options: ["30", "32", "36", "38"],
    correctAnswer: "36",
    category: "General Knowledge",
  },
  {
    question: "Which Nigerian musician is known as 'Fela'?",
    options: ["Fela Kuti", "Wizkid", "Davido", "Burna Boy"],
    correctAnswer: "Fela Kuti",
    category: "Music",
  },
  {
    question: "Which state is known as the 'Coal City'?",
    options: ["Enugu", "Kaduna", "Jos", "Benin"],
    correctAnswer: "Enugu",
    category: "Geography",
  },
  {
    question: "Which Nigerian author wrote 'Things Fall Apart'?",
    options: [
      "Chimamanda Adichie",
      "Chinua Achebe",
      "Wole Soyinka",
      "Ben Okri",
    ],
    correctAnswer: "Chinua Achebe",
    category: "Literature",
  },
  {
    question: "Which Nigerian state is famous for oil production?",
    options: ["Lagos", "Kano", "Rivers", "Oyo"],
    correctAnswer: "Rivers",
    category: "Economy",
  },
  {
    question: "What does 'NYSC' stand for?",
    options: [
      "National Youth Service Corps",
      "Nigerian Young Students' Club",
      "National Youth Sports Club",
      "None of the above",
    ],
    correctAnswer: "National Youth Service Corps",
    category: "General Knowledge",
  },
  {
    question: "Which Nigerian won the Nobel Prize for Literature?",
    options: [
      "Chinua Achebe",
      "Wole Soyinka",
      "Chimamanda Adichie",
      "Ben Okri",
    ],
    correctAnswer: "Wole Soyinka",
    category: "Literature",
  },
  {
    question: "Where is the Zuma Rock located?",
    options: ["Abuja", "Niger State", "Kogi", "Kaduna"],
    correctAnswer: "Niger State",
    category: "Geography",
  },
  {
    question: "Which Nigerian city is known as the 'Centre of Excellence'?",
    options: ["Abuja", "Lagos", "Ibadan", "Jos"],
    correctAnswer: "Lagos",
    category: "Geography",
  },
  {
    question: "What is the dominant religion in northern Nigeria?",
    options: ["Christianity", "Islam", "Traditional", "Hinduism"],
    correctAnswer: "Islam",
    category: "Culture",
  },
  {
    question: "Which local government is the largest in Nigeria?",
    options: ["Obio-Akpor", "Alimosho", "Ikeja", "Gwale"],
    correctAnswer: "Alimosho",
    category: "Geography",
  },
  {
    question: "Who is known as the 'Zik of Africa'?",
    options: [
      "Olusegun Obasanjo",
      "Ahmadu Bello",
      "Nnamdi Azikiwe",
      "Tafawa Balewa",
    ],
    correctAnswer: "Nnamdi Azikiwe",
    category: "History",
  },
  {
    question: "What is Nigeria’s currency called?",
    options: ["Dollar", "Cedi", "Naira", "Shilling"],
    correctAnswer: "Naira",
    category: "Economy",
  },
  {
    question: "Which Nigerian artist sang 'Fall'?",
    options: ["Burna Boy", "Davido", "Wizkid", "Olamide"],
    correctAnswer: "Davido",
    category: "Entertainment",
  },
  {
    question: "What color is the Nigerian flag?",
    options: [
      "Green, White, Green",
      "Red, White, Blue",
      "Green and Yellow",
      "Blue and White",
    ],
    correctAnswer: "Green, White, Green",
    category: "General Knowledge",
  },
  {
    question: "Which river is the longest in Nigeria?",
    options: ["River Benue", "River Ogun", "River Niger", "River Osun"],
    correctAnswer: "River Niger",
    category: "Geography",
  },
  {
    question: "Which year was the Nigerian Civil War?",
    options: ["1966", "1967", "1970", "1975"],
    correctAnswer: "1967",
    category: "History",
  },
  {
    question: "Which state is known as the 'Centre of Excellence'?",
    options: ["Abuja", "Kano", "Lagos", "Ogun"],
    correctAnswer: "Lagos",
    category: "Geography",
  },
  {
    question: "What is the name of Nigeria’s national anthem?",
    options: [
      "Rise and Shine",
      "Arise O Compatriots",
      "Nigeria My Country",
      "Lift Up Your Heads",
    ],
    correctAnswer: "Arise O Compatriots",
    category: "Culture",
  },
  {
    question: "Who is known as the 'Lion of Bourdillon'?",
    options: [
      "Goodluck Jonathan",
      "Atiku Abubakar",
      "Muhammadu Buhari",
      "Bola Ahmed Tinubu",
    ],
    correctAnswer: "Bola Ahmed Tinubu",
    category: "Politics",
  },
  {
    question: "Which university is the oldest in Nigeria?",
    options: [
      "University of Lagos",
      "Ahmadu Bello University",
      "University of Nigeria, Nsukka",
      "University of Ibadan",
    ],
    correctAnswer: "University of Ibadan",
    category: "Education",
  },
  {
    question: "What is the local name for corn in Yoruba?",
    options: ["Agbado", "Oka", "Masara", "Ogi"],
    correctAnswer: "Agbado",
    category: "Language",
  },
  {
    question:
      "Which Nigerian team won the 1996 Olympic gold medal in football?",
    options: ["Super Falcons", "Dream Team", "Golden Eaglets", "Super Eagles"],
    correctAnswer: "Dream Team",
    category: "Sports",
  },
  {
    question: "Who founded the Sokoto Caliphate?",
    options: [
      "Usman dan Fodio",
      "Ahmadu Bello",
      "Shehu Shagari",
      "Sardauna of Sokoto",
    ],
    correctAnswer: "Usman dan Fodio",
    category: "History",
  },
  {
    question: "Which Nollywood actor is nicknamed ‘Mr. Ibu’?",
    options: [
      "Osita Iheme",
      "John Okafor",
      "Chinedu Ikedieze",
      "Kanayo O Kanayo",
    ],
    correctAnswer: "John Okafor",
    category: "Entertainment",
  },
  {
    question: "How many geopolitical zones are in Nigeria?",
    options: ["5", "6", "7", "8"],
    correctAnswer: "6",
    category: "Geography",
  },
  {
    question: "Which festival is celebrated by the Yoruba people?",
    options: ["Durbar", "Argungu", "Osun-Osogbo", "Ofala"],
    correctAnswer: "Osun-Osogbo",
    category: "Culture",
  },
  {
    question: "What is the name of Nigeria’s Senate President as of 2023?",
    options: [
      "Ahmed Lawan",
      "Femi Gbajabiamila",
      "Godswill Akpabio",
      "Bukola Saraki",
    ],
    correctAnswer: "Godswill Akpabio",
    category: "Politics",
  },
  {
    question: "What is the traditional attire of the Igbo people?",
    options: ["Agbada", "Isi Agu", "Dashiki", "Buba"],
    correctAnswer: "Isi Agu",
    category: "Culture",
  },
  {
    question: "Which Nigerian musician won a Grammy in 2021?",
    options: ["Davido", "Wizkid", "Burna Boy", "Tems"],
    correctAnswer: "Burna Boy",
    category: "Entertainment",
  },
  {
    question: "Which river joins the Niger at Lokoja?",
    options: ["Osun", "Gongola", "Benue", "Ogun"],
    correctAnswer: "Benue",
    category: "Geography",
  },
  {
    question: "What is the Nigerian national pledge’s first line?",
    options: [
      "I promise to serve Nigeria with all my strength",
      "To be faithful, loyal and honest",
      "I pledge to Nigeria my country",
      "To defend her unity",
    ],
    correctAnswer: "I pledge to Nigeria my country",
    category: "Culture",
  },
  {
    question: "Which Nigerian city is famous for its bronze sculptures?",
    options: ["Abuja", "Benin City", "Lagos", "Jos"],
    correctAnswer: "Benin City",
    category: "History",
  },
  {
    question: "Which state is referred to as the 'Coal City State'?",
    options: ["Enugu", "Abia", "Ebonyi", "Anambra"],
    correctAnswer: "Enugu",
    category: "Geography",
  },
  {
    question: "Who wrote the novel 'Things Fall Apart'?",
    options: [
      "Wole Soyinka",
      "Chinua Achebe",
      "Chimamanda Adichie",
      "Ben Okri",
    ],
    correctAnswer: "Chinua Achebe",
    category: "Literature",
  },
  {
    question: "Which tribe is known for the Argungu Fishing Festival?",
    options: ["Nupe", "Hausa", "Yoruba", "Igbo"],
    correctAnswer: "Hausa",
    category: "Culture",
  },
  {
    question: "What is Nigeria's international dialing code?",
    options: ["+234", "+233", "+235", "+236"],
    correctAnswer: "+234",
    category: "General Knowledge",
  },
  {
    question: "Who was the first Nigerian to win a Nobel Prize?",
    options: [
      "Chinua Achebe",
      "Wole Soyinka",
      "Nnamdi Azikiwe",
      "Buchi Emecheta",
    ],
    correctAnswer: "Wole Soyinka",
    category: "Literature",
  },
  {
    question: "What is the traditional ruler of the Yoruba people called?",
    options: ["Emir", "Oba", "Igwe", "Sarki"],
    correctAnswer: "Oba",
    category: "Culture",
  },
  {
    question: "Which animal is on the Nigerian Coat of Arms?",
    options: ["Elephant", "Horse", "Lion", "Cow"],
    correctAnswer: "Horse",
    category: "General Knowledge",
  },
  {
    question: "What is the highest mountain in Nigeria?",
    options: ["Mount Patti", "Mount Kilimanjaro", "Chappal Waddi", "Obudu"],
    correctAnswer: "Chappal Waddi",
    category: "Geography",
  },
  {
    question: "Which state is the oil-rich Niger Delta located in?",
    options: ["Borno", "Edo", "Bayelsa", "Osun"],
    correctAnswer: "Bayelsa",
    category: "Economy",
  },
  {
    question: "Which Nigerian leader declared war on Biafra in 1967?",
    options: [
      "Yakubu Gowon",
      "Olusegun Obasanjo",
      "Aguiyi Ironsi",
      "Ibrahim Babangida",
    ],
    correctAnswer: "Yakubu Gowon",
    category: "History",
  },
  {
    question: "What is the Nigerian Police emergency number?",
    options: ["911", "199", "112", "123"],
    correctAnswer: "112",
    category: "General Knowledge",
  },
  {
    question: "Who is the current Sultan of Sokoto?",
    options: [
      "Sanusi Lamido Sanusi",
      "Sa’adu Abubakar",
      "Aminu Tambuwal",
      "Ibrahim Dasuki",
    ],
    correctAnswer: "Sa’adu Abubakar",
    category: "Religion",
  },
  {
    question: "Which is Nigeria's national flower?",
    options: ["Sunflower", "Flame Tree", "Costus Spectabilis", "Hibiscus"],
    correctAnswer: "Costus Spectabilis",
    category: "Nature",
  },
  {
    question: "How many local government areas (LGAs) does Nigeria have?",
    options: ["774", "500", "888", "650"],
    correctAnswer: "774",
    category: "General Knowledge",
  },
  {
    question: "Which Nigerian airport is the busiest?",
    options: [
      "Aminu Kano International Airport",
      "Port Harcourt International",
      "Nnamdi Azikiwe International",
      "Murtala Muhammed International",
    ],
    correctAnswer: "Murtala Muhammed International",
    category: "Geography",
  },
  {
    question: "Which mineral is Nigeria known for besides oil?",
    options: ["Gold", "Diamond", "Copper", "Tin"],
    correctAnswer: "Tin",
    category: "Economy",
  },
  {
    question: "What religion is most practiced in northern Nigeria?",
    options: ["Christianity", "Islam", "Traditional", "Hinduism"],
    correctAnswer: "Islam",
    category: "Religion",
  },
  {
    question: "Who is the current president of Nigeria (as of 2023)?",
    options: [
      "Goodluck Jonathan",
      "Muhammadu Buhari",
      "Bola Ahmed Tinubu",
      "Atiku Abubakar",
    ],
    correctAnswer: "Bola Ahmed Tinubu",
    category: "Politics",
  },
  {
    question: "What is Nigeria’s international passport color?",
    options: ["Green", "Red", "Blue", "Black"],
    correctAnswer: "Green",
    category: "General Knowledge",
  },
];

const seedTrivia = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    await TriviaQuestion.deleteMany();
    await TriviaQuestion.insertMany(questions);
    console.log("✅ Trivia questions seeded!");
    mongoose.disconnect();
  } catch (err) {
    console.error("❌ Seeding error:", err);
  }
};

seedTrivia();
