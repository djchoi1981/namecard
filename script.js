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

// Initialize Firebase (Compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const cardDocRef = db.collection("cards").doc("main");

// Default Card Data
const defaultData = {
  name: '최덕진',
  title: '보험컨설턴트',
  company: '프리미엄 금융 솔루션',
  phone: '010-5646-2464',
  email: 'djchoi19810402@gmail.com',
  albumTitle: '경력 및 자격증 (슬라이드)',
  certificates: [
    { image: 'cert1.png', title: '자격증 및 라이센스', tag: '자격증' },
    { image: 'cert2.png', title: '우수 컨설턴트 수상 경력', tag: '수상 경력' }
  ]
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
const inputAlbumTitle = document.getElementById('input-album-title');
const certEditList = document.getElementById('cert-edit-list');
const btnAddCertItem = document.getElementById('btn-add-cert-item');

// ─── Image Compression Helper ─────────────────────────────────────────────
// Resizes & compresses an image DataURL using Canvas.
// maxW: max width in px, quality: 0~1 (JPEG), returns Promise<string>
function compressImage(dataUrl, maxW = 800, quality = 0.72) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = dataUrl;
  });
}

// Avatar Upload Elements
const avatarUploadWrap = document.getElementById('avatar-upload-wrap');
const avatarPreview = document.getElementById('avatar-preview');
const inputAvatar = document.getElementById('input-avatar');

// Pending avatar data (Base64) — set when user picks a file before saving
let pendingAvatarData = null;

// Avatar upload click
if (avatarUploadWrap && inputAvatar) {
  avatarUploadWrap.addEventListener('click', () => inputAvatar.click());
  inputAvatar.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Compress avatar: max 600px wide (portrait), quality 0.75
      const compressed = await compressImage(ev.target.result, 600, 0.75);
      pendingAvatarData = compressed;
      if (avatarPreview) avatarPreview.src = compressed;
    };
    reader.readAsDataURL(file);
  });
}

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
    const docSnap = await cardDocRef.get();
    if (docSnap.exists) {
      cardData = docSnap.data();
      localStorage.setItem('cardData', JSON.stringify(cardData));
      console.log('Loaded card data from Firestore successfully');
    } else {
      console.log('No document found in Firestore. Initializing with local/default data...');
      loadLocalOrPresetData();
      // Save it to Firestore so the document is created
      await cardDocRef.set(cardData);
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

  // Update card background (profile photo)
  if (cardData.avatar) {
    card.style.setProperty('--avatar-url', `url('${cardData.avatar}')`);
  } else {
    card.style.removeProperty('--avatar-url');
  }

  // Render Album Section Title & Certificates Slider
  const albumTitleDisplay = document.getElementById('display-album-title');
  const albumContainer = document.getElementById('album-container');
  const albumSection = document.getElementById('album-section');
  
  if (albumTitleDisplay && albumContainer && albumSection) {
    albumTitleDisplay.innerText = cardData.albumTitle || '경력 및 자격증 (슬라이드)';
    albumContainer.innerHTML = '';
    
    const certs = cardData.certificates || [];
    if (certs.length === 0) {
      albumSection.style.display = 'none';
    } else {
      albumSection.style.display = 'block';

      // Build cards
      certs.forEach((cert, idx) => {
        const card = document.createElement('div');
        card.className = 'album-card';
        card.onclick = () => window.openLightbox(cert.image, cert.title);
        
        const img = document.createElement('img');
        img.src = cert.image;
        img.alt = cert.title;
        
        // Overlay with title + tag
        const overlay = document.createElement('div');
        overlay.className = 'album-card-overlay';
        
        const cardTitle = document.createElement('span');
        cardTitle.className = 'album-card-title';
        cardTitle.innerText = cert.title;
        
        const tag = document.createElement('div');
        tag.className = 'album-tag';
        tag.innerText = cert.tag;
        
        overlay.appendChild(cardTitle);
        overlay.appendChild(tag);
        card.appendChild(img);
        card.appendChild(overlay);
        albumContainer.appendChild(card);
      });

      // Build dots
      const dotsContainer = document.getElementById('album-dots');
      if (dotsContainer) {
        dotsContainer.innerHTML = '';
        certs.forEach((_, idx) => {
          const dot = document.createElement('span');
          dot.className = 'album-dot' + (idx === 0 ? ' active' : '');
          dot.addEventListener('click', () => {
            albumContainer.scrollTo({ left: albumContainer.offsetWidth * idx, behavior: 'smooth' });
          });
          dotsContainer.appendChild(dot);
        });
      }

      // Sync dots on scroll
      albumContainer.addEventListener('scroll', () => {
        const index = Math.round(albumContainer.scrollLeft / albumContainer.offsetWidth);
        document.querySelectorAll('#album-dots .album-dot').forEach((dot, i) => {
          dot.classList.toggle('active', i === index);
        });
      }, { passive: true });

      // Nav arrows
      const prevBtn = document.getElementById('album-prev');
      const nextBtn = document.getElementById('album-next');
      if (prevBtn && nextBtn) {
        prevBtn.onclick = () => {
          const index = Math.round(albumContainer.scrollLeft / albumContainer.offsetWidth);
          albumContainer.scrollTo({ left: albumContainer.offsetWidth * Math.max(0, index - 1), behavior: 'smooth' });
        };
        nextBtn.onclick = () => {
          const index = Math.round(albumContainer.scrollLeft / albumContainer.offsetWidth);
          albumContainer.scrollTo({ left: albumContainer.offsetWidth * Math.min(certs.length - 1, index + 1), behavior: 'smooth' });
        };
      }
    }
  }
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

// Helper to render certificate input rows in edit modal
function renderCertEditRows(certs) {
  certEditList.innerHTML = '';
  certs.forEach(cert => {
    addCertEditRow(cert.image, cert.title, cert.tag);
  });
}

function addCertEditRow(image = '', title = '', tag = '') {
  const row = document.createElement('div');
  row.className = 'cert-edit-row';
  
  // --- Image Upload Area ---
  const imgUploadArea = document.createElement('div');
  imgUploadArea.className = 'cert-img-upload-area';
  
  const imgPreview = document.createElement('img');
  imgPreview.className = 'cert-img-preview';
  imgPreview.src = image || '';
  imgPreview.style.display = image ? 'block' : 'none';
  imgPreview.alt = '미리보기';
  
  // Store current image data (Base64 or path) on the row element itself
  row.dataset.imageData = image;
  
  const imgPlaceholder = document.createElement('div');
  imgPlaceholder.className = 'cert-img-placeholder';
  imgPlaceholder.style.display = image ? 'none' : 'flex';
  imgPlaceholder.innerHTML = '<i class="fa-solid fa-image"></i><span>이미지 선택</span>';
  
  // Hidden file input
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      // Compress cert image: max 800px, quality 0.72
      const compressed = await compressImage(ev.target.result, 800, 0.72);
      row.dataset.imageData = compressed;
      imgPreview.src = compressed;
      imgPreview.style.display = 'block';
      imgPlaceholder.style.display = 'none';
    };
    reader.readAsDataURL(file);
  });
  
  imgUploadArea.addEventListener('click', () => fileInput.click());
  
  imgUploadArea.appendChild(imgPreview);
  imgUploadArea.appendChild(imgPlaceholder);
  imgUploadArea.appendChild(fileInput);
  
  // --- Text Fields ---
  const fields = document.createElement('div');
  fields.className = 'cert-edit-fields';
  
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.className = 'cert-title-input';
  titleInput.placeholder = '제목 (예: 자격증 및 라이센스)';
  titleInput.value = title;
  
  const tagInput = document.createElement('input');
  tagInput.type = 'text';
  tagInput.className = 'cert-tag-input';
  tagInput.placeholder = '태그 (예: 자격증)';
  tagInput.value = tag;
  
  fields.appendChild(imgUploadArea);
  fields.appendChild(titleInput);
  fields.appendChild(tagInput);
  
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'del-cert-btn';
  delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
  delBtn.onclick = () => row.remove();
  
  row.appendChild(fields);
  row.appendChild(delBtn);
  certEditList.appendChild(row);
}

// Add cert item button listener
btnAddCertItem.addEventListener('click', () => {
  addCertEditRow();
});

// 6. Edit Modal Toggle
btnToggleEdit.addEventListener('click', () => {
  inputName.value = cardData.name;
  inputTitle.value = cardData.title;
  inputCompany.value = cardData.company;
  inputPhone.value = cardData.phone;
  inputEmail.value = cardData.email;
  inputAlbumTitle.value = cardData.albumTitle || '경력 및 자격증 (슬라이드)';
  renderCertEditRows(cardData.certificates || []);
  
  // Reset avatar preview to current saved avatar
  pendingAvatarData = null;
  if (avatarPreview) {
    avatarPreview.src = cardData.avatar || 'avatar.jpg';
  }
  if (inputAvatar) inputAvatar.value = '';
  
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
  
  // Extract certificates from edit list rows
  const certsArray = [];
  const rows = certEditList.querySelectorAll('.cert-edit-row');
  rows.forEach(row => {
    const imgVal = row.dataset.imageData || '';
    const titleVal = row.querySelector('.cert-title-input').value.trim();
    const tagVal = row.querySelector('.cert-tag-input').value.trim();
    
    // Only save if at least title is provided
    if (titleVal) {
      certsArray.push({
        image: imgVal,
        title: titleVal,
        tag: tagVal || '자격증'
      });
    }
  });
  
  cardData = {
    name,
    title,
    company,
    phone,
    email,
    albumTitle: inputAlbumTitle.value.trim(),
    certificates: certsArray,
    avatar: pendingAvatarData !== null ? pendingAvatarData : (cardData.avatar || '')
  };
  
  // 1. Always save FULL data (including images) to localStorage for this browser
  localStorage.setItem('cardData', JSON.stringify(cardData));
  updateDOM();
  editModal.classList.remove('show');
  showToast('명함 정보가 저장되었습니다.');
  
  // 2. Sync to Firestore — strip Base64 images to stay under 1MB limit.
  //    Images are stored in localStorage only; other browsers will see
  //    the card without images (text/contact info still works perfectly).
  const firestoreData = {
    name: cardData.name,
    title: cardData.title,
    company: cardData.company,
    phone: cardData.phone,
    email: cardData.email,
    albumTitle: cardData.albumTitle,
    // Store only title & tag in Firestore; image Base64 stays local
    certificates: cardData.certificates.map(c => ({
      title: c.title,
      tag: c.tag,
      // Keep image only if it's a plain path/URL (not Base64)
      image: c.image && !c.image.startsWith('data:') ? c.image : ''
    })),
    // Same for avatar
    avatar: cardData.avatar && !cardData.avatar.startsWith('data:') ? cardData.avatar : ''
  };

  console.log('Syncing card data to Firestore...');
  cardDocRef.set(firestoreData)
    .then(() => {
      console.log('Successfully synced card data to Firestore');
    })
    .catch((error) => {
      console.error('Failed to sync card data to Firestore:', error);
      // Don't show error toast — local save already succeeded
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
