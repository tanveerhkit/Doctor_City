const LOST_FOUND_KEY = "doctorcity.prototype.lostFound";
const CHAT_MESSAGES_KEY = "doctorcity.prototype.chatMessages";
const CONTACT_SUBMISSIONS_KEY = "doctorcity.prototype.contactSubmissions";

const lostFoundSeed = [
  {
    id: 1,
    type: "found",
    name: "Blue Backpack",
    description:
      "Found near the metro entrance with notebooks and a water bottle inside.",
    location: "Majestic Metro Gate 2",
    date: "2026-04-07",
    contactName: "Riya",
    contactPhone: "+91 98765 11111",
    contactEmail: "riya.demo@doctorcity.local",
  },
  {
    id: 2,
    type: "lost",
    name: "Office ID Card",
    description:
      "Lost black lanyard with an employee badge while commuting back from work.",
    location: "Koramangala 5th Block",
    date: "2026-04-08",
    contactName: "Arjun",
    contactPhone: "+91 98765 22222",
    contactEmail: "arjun.demo@doctorcity.local",
  },
];

const chatSeed = [
  {
    id: 1,
    user: "Rajesh Jain",
    avatar: "RJ",
    message:
      "The ward office confirmed tomorrow’s cleanup drive starts at 8:30 AM. Gloves and bags will be available on site.",
    timestamp: "09:15 AM",
    isCurrentUser: false,
  },
  {
    id: 2,
    user: "Meera Singh",
    avatar: "MS",
    message:
      "I can coordinate volunteers for the park entrance. Please share if any families need transport support.",
    timestamp: "09:22 AM",
    isCurrentUser: false,
  },
  {
    id: 3,
    user: "Kashvi Malik",
    avatar: "KM",
    message:
      "The food donation point is now open until 6 PM today. Essentials and dry groceries are the highest priority.",
    timestamp: "09:28 AM",
    isCurrentUser: false,
  },
];

const safeRead = (key, seedValue) => {
  try {
    const rawValue = localStorage.getItem(key);
    if (!rawValue) {
      localStorage.setItem(key, JSON.stringify(seedValue));
      return seedValue;
    }

    return JSON.parse(rawValue);
  } catch (error) {
    console.error(`Failed to read prototype storage key: ${key}`, error);
    return seedValue;
  }
};

const safeWrite = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("storage-update"));
};

export const getLostAndFoundItems = () => safeRead(LOST_FOUND_KEY, lostFoundSeed);

export const addLostAndFoundItem = (item) => {
  const items = getLostAndFoundItems();
  const nextItems = [
    {
      ...item,
      id: Date.now(),
    },
    ...items,
  ];
  safeWrite(LOST_FOUND_KEY, nextItems);
  return nextItems;
};

export const getChatMessages = () => safeRead(CHAT_MESSAGES_KEY, chatSeed);

export const addChatMessage = (message) => {
  const messages = getChatMessages();
  const nextMessages = [
    ...messages,
    {
      ...message,
      id: Date.now(),
    },
  ];
  safeWrite(CHAT_MESSAGES_KEY, nextMessages);
  return nextMessages;
};

export const getContactSubmissions = () =>
  safeRead(CONTACT_SUBMISSIONS_KEY, []);

export const addContactSubmission = (submission) => {
  const submissions = getContactSubmissions();
  const nextSubmissions = [
    {
      ...submission,
      id: Date.now(),
      referenceCode: `SUP-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    },
    ...submissions,
  ];
  safeWrite(CONTACT_SUBMISSIONS_KEY, nextSubmissions);
  return nextSubmissions[0];
};

