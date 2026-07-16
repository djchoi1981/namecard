import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Kakao Javascript App Key
const KAKAO_APP_KEY = 'YOUR_KAKAO_JAVASCRIPT_APP_KEY';

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDu1aP6u6VJvTALY8pfeP1s_4KU28ouXYg",
  authDomain: "namecard-916cd.firebaseapp.com",
  projectId: "namecard-916cd",
  storageBucket: "namecard-916cd.firebasestorage.app",
  messagingSenderId: "287295124883",
  appId: "1:287295124883:web:ee9ee810dff04dd3426466",
  measurementId: "G-E176M6EENT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const cardDocRef = doc(db, "cards", "main");

// Default Card Data
const defaultData = {
  name: '최덕진',
  title: '보험컨설턴트',
  company: '프리미엄 금융 솔루션',
  phone: '010-5646-2464',
  email: 'djchoi19810402@gmail.com'
};

// State
let cardData = { ...defaultData };
let isKakaoInitialized = false;

// Initialize Kakao SDK
if (KAKAO_APP_KEY && KAKAO_APP_KEY !== 'YOUR_KAKAO_JAVASCRIPT_APP_KEY') {
  try {
    Kakao.init(KAKAO_APP_KEY);
    isKakaoInitialized = Kakao.isInitialized();
    console.log('Kakao SDK Initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Kakao SDK:', error);
  }
}

// DOM Elements
const card = document.getElementById('business-card');
const container = document.querySelector('.container');
const btnKakaoShare = document.getElementById('btn-kakao-share');
const btnSaveContact = document.getElementById('btn-save-contact');
const btnQr = document.getElementById('btn-qr');
const btnCopyLink = document.getElementById('btn-copy-link');
const qrModal = document.getElementById('qr-modal');
const qrImg = document.getElementById('qr-img');
const modalClose = document.getElementById('modal-close');
const toast = document.getElementById('toast-message');

// Edit Modal Elements
const btnToggleEdit = document.getElementById('btn-toggle-edit');
const editModal = document.getElementById('edit-modal');
const editModalClose = document.getElementById('edit-modal-close');
const btnSaveEdit = document.getElementById('btn-save-edit');
const inputName = document.getElementById('input-name');
const inputTitle = document.getElementById('input-title');
const inputCompany = document.getElementById('input-company');
const inputPhone = document.getElementById('input-phone');
const inputEmail = document.getElementById('input-email');

// Lightbox Elements
const lightboxModal = document.getElementById('lightbox-modal');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxClose = document.getElementById('lightbox-close');

// Display Elements
const displayName = document.getElementById('display-name');
const displayTitle = document.getElementById('display-title');
const displayCompany = document.getElementById('display-company');
const valPhone = document.getElementById('val-phone');
const valEmail = document.getElementById('val-email');
const linkPhone = document.getElementById('link-phone');
const linkEmail = document.getElementById('link-email');

// URLs Handling
// 고객 공유용 깨끗한 URL 만들기 (편집 파라미터 ?edit=true 제거)
let cleanUrl = window.location.href;
if (window.location.protocol !== 'file:') {
  cleanUrl = window.location.origin + window.location.pathname;
} else {
  // 로컬 파일 경로인 경우 URL 파라미터만 제거
  try {
    const urlObj = new URL(window.location.href);
    urlObj.searchParams.delete('edit');
    cleanUrl = urlObj.href;
  } catch (e) {
    cleanUrl = window.location.href;
  }
}

// 편집 버튼 노출 여부 판단
// 1. URL 파라미터에 ?edit=true 가 있거나
// 2. 로컬 개발 환경(file:/// 또는 localhost)에서 실행 중일 때만 편집 버튼을 노출합니다.
const urlParams = new URLSearchParams(window.location.search);
const isLocal = window.location.protocol === 'file:' || 
                window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';
const showEditButton = urlParams.get('edit') === 'true' || isLocal;

if (showEditButton) {
  btnToggleEdit.style.display = 'flex';
} else {
  btnToggleEdit.style.display = 'none';
}

// Load Data from LocalStorage
// Load Data from Firestore (with LocalStorage fallback)
async function loadCardData() {
  try {
    const docSnap = await getDoc(cardDocRef);
    if (docSnap.exists()) {
      cardData = docSnap.data();
      localStorage.setItem('cardData', JSON.stringify(cardData));
      console.log('Loaded card data from Firestore successfully');
    } else {
      console.log('No document found in Firestore. Initializing with local/default data...');
      loadLocalOrPresetData();
      // Save it to Firestore so the document is created
      await setDoc(cardDocRef, cardData);
      console.log('Initialized Firestore with default card data');
    }
  } catch (error) {
    console.error('Failed to load card data from Firestore. Falling back to LocalStorage:', error);
    loadLocalOrPresetData();
  }
  updateDOM();
}

function loadLocalOrPresetData() {
  const savedData = localStorage.getItem('cardData');
  if (savedData) {
    try {
      cardData = JSON.parse(savedData);
    } catch (e) {
      console.error('Error parsing saved local card data:', e);
      cardData = { ...defaultData };
    }
  } else {
    cardData = { ...defaultData };
    localStorage.setItem('cardData', JSON.stringify(defaultData));
  }
}

// Update DOM with cardData values
function updateDOM() {
  displayName.innerHTML = cardData.name;
  displayTitle.innerText = cardData.title;
  displayCompany.innerText = cardData.company;
  
  valPhone.innerText = cardData.phone;
  valEmail.innerText = cardData.email;
  
  // Format phone number to clean numeric string for tel: link
  const cleanPhone = cardData.phone.replace(/[^0-9]/g, '');
  linkPhone.href = `tel:${cleanPhone}`;
  linkEmail.href = `mailto:${cardData.email}`;
  
  document.title = `${cardData.name} | 디지털 명함`;
}

// 1. 3D Card Hover Effect (Desktop Only)
if (window.matchMedia('(pointer: fine)').matches) {
  container.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotateX = -y / 25;
    const rotateY = x / 25;
    
    card.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  container.addEventListener('mouseenter', () => {
    card.style.transition = 'none';
  });

  container.addEventListener('mouseleave', () => {
    card.style.transition = 'transform 0.5s ease, box-shadow 0.5s ease';
    card.style.transform = 'rotateX(0deg) rotateY(0deg)';
  });
}

// 2. Toast Notification Helper
function showToast(message) {
  toast.innerText = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

// 3. Share to KakaoTalk / Web Share API (고객 전달 시에는 편집 파라미터가 빠진 cleanUrl 전달)
btnKakaoShare.addEventListener('click', async () => {
  const shareTitle = `${cardData.name} | 디지털 명함`;
  const shareDesc = `안녕하세요. ${cardData.name}의 디지털 명함입니다. 연락처 저장 및 공유가 가능합니다.`;
  
  if (isKakaoInitialized) {
    try {
      Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title: shareTitle,
          description: shareDesc,
          // 카카오 미리보기 썸네일용 절대경로 이미지
          imageUrl: window.location.origin + '/avatar.jpg',
          link: {
            mobileWebUrl: cleanUrl,
            webUrl: cleanUrl,
          },
        },
        buttons: [
          {
            title: '명함 보기',
            link: {
              mobileWebUrl: cleanUrl,
              webUrl: cleanUrl,
            },
          },
        ],
      });
      return;
    } catch (e) {
      console.warn('Kakao link share failed, falling back to Web Share API:', e);
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareDesc,
        url: cleanUrl,
      });
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error sharing:', err);
      }
    }
  } else {
    copyLinkToClipboard();
  }
});

// 4. Save Contact (vCard Generator)
btnSaveContact.addEventListener('click', () => {
  const { name, phone, email, company, title } = cardData;
  
  // Create vCard structure (UTF-8)
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N;CHARSET=utf-8:${name};;;;`,
    `FN;CHARSET=utf-8:${name}`,
    `ORG;CHARSET=utf-8:${company}`,
    `TITLE;CHARSET=utf-8:${title}`,
    `TEL;TYPE=CELL,VOICE:${phone}`,
    `EMAIL;TYPE=PREF,INTERNET:${email}`,
    `URL:${cleanUrl}`,
    'END:VCARD'
  ].join('\r\n');

  const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8;' });
  const blobUrl = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.download = `${name}_명함.vcf`;
  link.href = blobUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
  
  showToast('연락처 파일 다운로드가 시작되었습니다.');
});

// 5. QR Code Modal Toggle (고객용 cleanUrl로 생성)
btnQr.addEventListener('click', () => {
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(cleanUrl)}`;
  qrImg.src = qrApiUrl;
  qrModal.classList.add('show');
});

modalClose.addEventListener('click', () => {
  qrModal.classList.remove('show');
});

qrModal.addEventListener('click', (e) => {
  if (e.target === qrModal) {
    qrModal.classList.remove('show');
  }
});

// 6. Edit Modal Toggle
btnToggleEdit.addEventListener('click', () => {
  inputName.value = cardData.name;
  inputTitle.value = cardData.title;
  inputCompany.value = cardData.company;
  inputPhone.value = cardData.phone;
  inputEmail.value = cardData.email;
  
  editModal.classList.add('show');
});

editModalClose.addEventListener('click', () => {
  editModal.classList.remove('show');
});

editModal.addEventListener('click', (e) => {
  if (e.target === editModal) {
    editModal.classList.remove('show');
  }
});

// 7. Save Edited Data
btnSaveEdit.addEventListener('click', () => {
  const name = inputName.value.trim();
  const title = inputTitle.value.trim();
  const company = inputCompany.value.trim();
  const phone = inputPhone.value.trim();
  const email = inputEmail.value.trim();
  
  if (!name || !phone || !email) {
    alert('이름, 전화번호, 이메일은 필수 입력 사항입니다.');
    return;
  }
  
  cardData = { name, title, company, phone, email };
  
  // 1. Save to LocalStorage immediately for instant local UI update
  localStorage.setItem('cardData', JSON.stringify(cardData));
  updateDOM();
  editModal.classList.remove('show');
  showToast('명함 정보가 저장되었습니다.');
  
  // 2. Sync to Firestore in the background
  console.log('Syncing card data to Firestore...');
  setDoc(cardDocRef, cardData)
    .then(() => {
      console.log('Successfully synced card data to Firestore');
    })
    .catch((error) => {
      console.error('Failed to sync card data to Firestore:', error);
      showToast('서버 동기화 실패 (로컬 브라우저에만 저장됨)');
    });
});

// 8. Lightbox Functionality
window.openLightbox = function(src, title) {
  lightboxImg.src = src;
  lightboxTitle.innerText = title;
  lightboxModal.classList.add('show');
};

lightboxClose.addEventListener('click', () => {
  lightboxModal.classList.remove('show');
});

lightboxModal.addEventListener('click', (e) => {
  if (e.target === lightboxModal) {
    lightboxModal.classList.remove('show');
  }
});

// 9. Copy Link to Clipboard (고객용 cleanUrl로 복사)
function copyLinkToClipboard() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(cleanUrl)
      .then(() => showToast('명함 링크가 복사되었습니다.'))
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        fallbackCopyText(cleanUrl);
      });
  } else {
    fallbackCopyText(cleanUrl);
  }
}

function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
    showToast('명함 링크가 복사되었습니다.');
  } catch (err) {
    console.error('Fallback copy failed:', err);
    showToast('링크 복사에 실패했습니다.');
  }
  document.body.removeChild(textArea);
}

btnCopyLink.addEventListener('click', copyLinkToClipboard);

// Init Load
loadCardData();
