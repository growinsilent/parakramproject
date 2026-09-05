/**
 * CIVIQ-PARAKRAM 1.0 - Citizen Portal & Multi-Modal Intake Module (Jan Vani)
 * Handles Voice Recording, Vision Defect Tagging, Multilingual i18n, and WhatsApp Simulation
 */

const CitizenPortal = (() => {
  let currentLanguage = 'en';
  let isRecording = false;
  let audioContext = null;
  let animationFrameId = null;

  // Multilingual Dictionaries (English, Odia, Hindi, Bengali)
  const i18n = {
    en: {
      heroBadge: 'Direct Citizen Voice Channel',
      heroTitle: 'Your Voice Shapes Your Constituency',
      heroSubtitle: 'Submit infrastructure issues, public school needs, drinking water failures, or road hazards via Voice, Photo Evidence, or WhatsApp in your mother tongue.',
      voiceTitle: 'Voice Recording (ବାଣୀ ରେକର୍ଡ)',
      voiceDesc: 'Speak in Odia, Hindi, or English. Our AI transcribes, translates, and extracts the core issue automatically.',
      photoTitle: 'Photo Evidence (ଫଟୋ ପ୍ରମାଣ)',
      photoDesc: 'Upload a photo of broken roads, leaking water lines, or damaged classrooms. Computer Vision auto-analyzes defect severity.',
      botTitle: 'WhatsApp Bot (ହ୍ୱାଟ୍ସଆପ୍ ବଟ୍)',
      botDesc: 'Simulates a citizen chatting on WhatsApp via +91-674-PARAKRAM. Conversational intake with automatic geo-tagging.',
      formTitle: 'Complete & Submit Formal Civic Suggestion',
      lblWard: 'Select Ward / Gram Panchayat:',
      lblCat: 'Development Category:',
      lblDesc: 'Describe the Issue or Development Request:',
      btnSubmit: 'Submit Priority to Higher Authorities',
      micPrompt: 'Click microphone to speak',
      micRecording: 'Listening... (Speak clearly into your microphone)',
      toastSuccess: 'Your submission was verified and logged into the Civic Intelligence Database. Ticket ID: '
    },
    or: {
      heroBadge: 'ପ୍ରତ୍ୟକ୍ଷ ନାଗରିକ ବାଣୀ ପୋର୍ଟାଲ୍',
      heroTitle: 'ଆପଣଙ୍କ ସ୍ୱର ଗଢ଼ିବ ଆପଣଙ୍କ ନିର୍ବାଚନ ମଣ୍ଡଳୀ',
      heroSubtitle: 'ଭଙ୍ଗା ରାସ୍ତା, ବିଦ୍ୟାଳୟ ସମସ୍ୟା, ପାନୀୟ ଜଳ କିମ୍ବା ସ୍ୱାସ୍ଥ୍ୟ ସେବା ଅଭାବ ବିଷୟରେ ଓଡ଼ିଆରେ କୁହନ୍ତୁ, ଫଟୋ ପଠାନ୍ତୁ ବା ହ୍ୱାଟ୍ସଆପ୍ ମାଧ୍ୟମରେ ଜଣାନ୍ତୁ।',
      voiceTitle: 'ଭଏସ୍ ରେକର୍ଡିଂ (ବାଣୀ ରେକର୍ଡ)',
      voiceDesc: 'ନିଜ ମାତୃଭାଷା ଓଡ଼ିଆରେ କୁହନ୍ତୁ। AI ସ୍ୱତଃ ପ୍ରବୃତ୍ତ ଭାବେ ଲିପ୍ୟନ୍ତର ଓ ଅନୁବାଦ କରିବ।',
      photoTitle: 'ଫଟୋ ପ୍ରମାଣ (ଫଟୋ ଅପଲୋଡ୍)',
      photoDesc: 'ଭଙ୍ଗା ଛାତ, ପୋଲ ବା ରାସ୍ତାର ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ। କମ୍ପ୍ୟୁଟର ଭିଜନ ବିପଦର ମାତ୍ରା ଯାଞ୍ଚ କରିବ।',
      botTitle: 'ହ୍ୱାଟ୍ସଆପ୍ ବଟ୍ (WhatsApp ସେବା)',
      botDesc: 'ସହଜରେ ଚାଟ୍ କରି ନିଜ ୱାର୍ଡର ସମସ୍ୟା ଦାଖଲ କରନ୍ତୁ। ତୁରନ୍ତ ଟିକେଟ୍ ନମ୍ବର ମିଳିବ।',
      formTitle: 'ସରକାରୀ ଉନ୍ନୟନ ପ୍ରସ୍ତାବ ଦାଖଲ କରନ୍ତୁ',
      lblWard: 'ୱାର୍ଡ / ଗ୍ରାମ ପଞ୍ଚାୟତ ବାଛନ୍ତୁ:',
      lblCat: 'ଉନ୍ନୟନ ବିଭାଗ:',
      lblDesc: 'ସମସ୍ୟା କିମ୍ବା ପ୍ରସ୍ତାବ ବିସ୍ତାରରେ ଲେଖନ୍ତୁ:',
      btnSubmit: 'ଶାସନ କର୍ତ୍ତୃପକ୍ଷଙ୍କୁ ପ୍ରେରଣ କରନ୍ତୁ',
      micPrompt: 'କହିବା ପାଇଁ ମାଇକ୍ରୋଫୋନରେ କ୍ଲିକ୍ କରନ୍ତୁ',
      micRecording: 'ଶୁଣୁଛି... (ନିଜ ଭାଷାରେ କୁହନ୍ତୁ)',
      toastSuccess: 'ଆପଣଙ୍କ ଅଭିଯୋଗ ସଫଳତାର ସହ ପଞ୍ଜୀକୃତ ହେଲା। ଟିକେଟ୍ ID: '
    },
    hi: {
      heroBadge: 'प्रत्यक्ष नागरिक जन-वाणी पोर्टल',
      heroTitle: 'आपकी आवाज़ बनाएगी आपका निर्वाचन क्षेत्र',
      heroSubtitle: 'टूटी सड़कें, स्कूल मरम्मत, पेयजल संकट अथवा स्वास्थ्य केंद्रों की समस्याएं अपनी भाषा में आवाज़, फोटो अथवा व्हाट्सएप द्वारा दर्ज करें।',
      voiceTitle: 'वॉयस रिकॉर्डिंग (आवाज़ में दर्ज करें)',
      voiceDesc: 'हिंदी में बोलें। हमारा AI अपने आप इसे लिखित रूप में अनुवाद कर दर्ज करेगा।',
      photoTitle: 'फोटो प्रमाण (तस्वीर अपलोड)',
      photoDesc: 'गड्ढे या क्षतिग्रस्त इमारत की तस्वीर दें। कंप्यूटर विज़न जोखिम का आकलन करेगा।',
      botTitle: 'व्हाट्सएप चैटबॉट',
      botDesc: 'व्हाट्सएप के ज़रिये सीधे बातचीत कर अपनी मांग उच्च अधिकारियों तक पहुंचाएं।',
      formTitle: 'विकास प्रस्ताव औपचारिक रूप से दर्ज करें',
      lblWard: 'वार्ड / ग्राम पंचायत चुनें:',
      lblCat: 'विकास श्रेणी:',
      lblDesc: 'समस्या अथवा मांग का विवरण दें:',
      btnSubmit: 'उच्च अधिकारियों को प्रस्तुत करें',
      micPrompt: 'बोलने के लिए माइक पर क्लिक करें',
      micRecording: 'सुन रहे हैं... (स्पष्ट रूप से बोलें)',
      toastSuccess: 'आपकी शिकायत सफलतापूर्वक दर्ज कर ली गई है। टिकट संख्या: '
    },
    bn: {
      heroBadge: 'নাগরিকের কণ্ঠস্বর পোর্টাল',
      heroTitle: 'আপনার কণ্ঠস্বর গড়বে আপনার নির্বাচনী এলাকা',
      heroSubtitle: 'ভাঙা রাস্তা, স্কুল সমস্যা, পানীয় জল বা স্বাস্থ্য সংকটের কথা সরাসরি জানান।',
      voiceTitle: 'ভয়েস রেকর্ডিং',
      voiceDesc: 'বাংলায় কথা বলুন, AI স্বয়ংক্রিয়ভাবে অনুবাদ ও বিশ্লেষণ করবে।',
      photoTitle: 'ছবির প্রমাণ',
      photoDesc: 'ক্ষতির ছবি আপলোড করুন, কম্পিউটার ভিশন বিশ্লেষণ করবে।',
      botTitle: 'হোয়াটসঅ্যাপ বট',
      botDesc: 'হোয়াটসঅ্যাপের মাধ্যমে সহজে অভিযোগ জমা দিন।',
      formTitle: 'আনুষ্ঠানিক প্রস্তাব জমা দিন',
      lblWard: 'ওয়ার্ড নির্বাচন করুন:',
      lblCat: 'উন্নয়ন বিভাগ:',
      lblDesc: 'সমস্যার বিবরণ লিখুন:',
      btnSubmit: 'উচ্চ কর্তৃপক্ষের কাছে জমা দিন',
      micPrompt: 'কথা বলতে মাইকে ক্লিক করুন',
      micRecording: 'শুনছি... (স্পষ্ট বলুন)',
      toastSuccess: 'আপনার অভিযোগ সফলভাবে গৃহীত হয়েছে। টিকিট নম্বর: '
    }
  };

  // Sample Photos for testing
  const samplePhotos = {
    pothole: {
      url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80',
      tags: ['deep_asphalt_crater', 'monsoon_waterlogged', 'accident_hazard_high'],
      hazard: '4.8 / 5.0 (Critical)',
      ward: 'W10',
      cat: 'Roads & Mobility',
      desc: 'Severe 2-foot pothole crater on Retang-Jatni arterial road. 3 bike accidents reported.'
    },
    school: {
      url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=400&q=80',
      tags: ['roof_structural_crack', 'monsoon_rain_leak', 'classroom_hazard'],
      hazard: '4.9 / 5.0 (Severe)',
      ward: 'W04',
      cat: 'Education',
      desc: 'Gohiria Nodal High School roof collapsed during heavy rain. 420 students unable to sit in class.'
    },
    phc: {
      url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80',
      tags: ['subcentre_dilapidated', 'no_maternal_unit', 'medical_access_crisis'],
      hazard: '4.7 / 5.0 (Emergency)',
      ward: 'W10',
      cat: 'Healthcare',
      desc: 'Retang primary health sub-centre has zero doctor attendance and no maternal delivery room.'
    }
  };

  // WhatsApp bot conversation state
  let waState = {
    step: 0,
    ward: '',
    category: '',
    complaint: ''
  };

  function init() {
    setupLanguageSwitcher();
    setupVoiceRecorder();
    setupPhotoUploader();
    setupWhatsAppBot();
    setupSubmissionForm();
  }

  function setupLanguageSwitcher() {
    const buttons = document.querySelectorAll('.lang-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentLanguage = btn.getAttribute('data-lang');
        updateUILanguage();
      });
    });
  }

  function updateUILanguage() {
    const dict = i18n[currentLanguage] || i18n.en;
    document.getElementById('txt-hero-badge').textContent = dict.heroBadge;
    document.getElementById('txt-hero-title').textContent = dict.heroTitle;
    document.getElementById('txt-hero-subtitle').textContent = dict.heroSubtitle;
    document.getElementById('txt-voice-title').textContent = dict.voiceTitle;
    document.getElementById('txt-voice-desc').textContent = dict.voiceDesc;
    document.getElementById('txt-photo-title').textContent = dict.photoTitle;
    document.getElementById('txt-photo-desc').textContent = dict.photoDesc;
    document.getElementById('txt-bot-title').textContent = dict.botTitle;
    document.getElementById('txt-bot-desc').textContent = dict.botDesc;
    document.getElementById('txt-form-title').textContent = dict.formTitle;
    document.getElementById('txt-lbl-ward').textContent = dict.lblWard;
    document.getElementById('txt-lbl-cat').textContent = dict.lblCat;
    document.getElementById('txt-lbl-desc').textContent = dict.lblDesc;
    document.getElementById('txt-btn-submit').textContent = dict.btnSubmit;
    document.getElementById('rec-status-display').textContent = isRecording ? dict.micRecording : dict.micPrompt;
  }

  // Voice recording simulation with real HTML5 Canvas waveform
  function setupVoiceRecorder() {
    const canvas = document.getElementById('voiceWaveform');
    const ctx = canvas.getContext('2d');
    const micBtn = document.getElementById('btn-mic-toggle');
    const statusDisplay = document.getElementById('rec-status-display');
    const previewBox = document.getElementById('transcription-preview');
    const transcriptionText = document.getElementById('transcription-text');

    let phase = 0;

    function drawIdleWaveform() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const mid = canvas.height / 2;
      for (let x = 0; x < canvas.width; x++) {
        const y = mid + Math.sin(x * 0.05) * 3;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    drawIdleWaveform();

    function drawActiveWaveform() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const mid = canvas.height / 2;
      phase += 0.15;
      for (let x = 0; x < canvas.width; x++) {
        const amplitude = 18 * Math.sin(x * 0.04 + phase) * Math.cos(x * 0.02);
        const y = mid + amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      if (isRecording) {
        animationFrameId = requestAnimationFrame(drawActiveWaveform);
      }
    }

    micBtn.addEventListener('click', () => {
      isRecording = !isRecording;
      if (isRecording) {
        micBtn.classList.add('recording');
        statusDisplay.textContent = i18n[currentLanguage]?.micRecording || 'Listening...';
        drawActiveWaveform();

        // Simulate 4-second speech recognition
        setTimeout(() => {
          if (isRecording) {
            isRecording = false;
            micBtn.classList.remove('recording');
            cancelAnimationFrame(animationFrameId);
            drawIdleWaveform();
            statusDisplay.textContent = 'Voice recording captured & analyzed!';
            
            previewBox.style.display = 'block';
            transcriptionText.innerHTML = `<strong>Raw Audio (Odia):</strong> "ଆମ ଗୋହିରିଆ ନୋଡାଲ ହାଇସ୍କୁଲ ଛାତ ବର୍ଷାରେ ଭାଙ୍ଗିଯାଇଛି, ୪୨୦ ପିଲା ଅସୁବିଧାରେ ଅଛନ୍ତି..."<br><strong>Canonical English:</strong> "Gohiria Nodal High School roof is broken and leaking rain. 420 students unable to study. Urgent classroom reconstruction required."`;
            
            // Auto-fill formal form
            document.getElementById('form-ward-select').value = 'W04';
            document.getElementById('form-category-select').value = 'Education';
            document.getElementById('form-issue-desc').value = 'Gohiria Nodal High School roof is broken and leaking rain. 420 students unable to study. Urgent classroom reconstruction required.';
          }
        }, 3500);
      } else {
        micBtn.classList.remove('recording');
        cancelAnimationFrame(animationFrameId);
        drawIdleWaveform();
        statusDisplay.textContent = i18n[currentLanguage]?.micPrompt || 'Click microphone to speak';
      }
    });

    // Sample voice prompts
    document.getElementById('btn-sample-voice-odia').addEventListener('click', () => {
      previewBox.style.display = 'block';
      transcriptionText.innerHTML = `<strong>Speech Input (Odia):</strong> "ଆମ ଗୋହିରିଆ ହାଇସ୍କୁଲ ଛାତ ମରାମତି ଏବଂ ନୂଆ କ୍ଲାସରୁମ୍ ଦରକାର।"<br><strong>Normalized:</strong> "Gohiria High School roof requires urgent repair and modern STEM classrooms."`;
      document.getElementById('form-ward-select').value = 'W04';
      document.getElementById('form-category-select').value = 'Education';
      document.getElementById('form-issue-desc').value = 'Gohiria High School roof requires urgent repair and modern STEM classrooms for 420 students.';
    });

    document.getElementById('btn-sample-voice-water').addEventListener('click', () => {
      previewBox.style.display = 'block';
      transcriptionText.innerHTML = `<strong>Speech Input (Odia):</strong> "ବାଲିଅନ୍ତା ଗାଁରେ ନଳକୂପ ସବୁ ଖରାପ, ଦୂଷିତ ପାଣି ପିଇ ଲୋକେ ରୋଗାକ୍ରାନ୍ତ ହେଉଛନ୍ତି।"<br><strong>Normalized:</strong> "Tube wells broken in Balianta village, villagers suffering from contaminated drinking water. Need piped water supply."`;
      document.getElementById('form-ward-select').value = 'W08';
      document.getElementById('form-category-select').value = 'Water & Sanitation';
      document.getElementById('form-issue-desc').value = 'Severe drinking water crisis in Balianta riverine block. Contaminated wells causing waterborne illnesses. Piped water network required.';
    });
  }

  // Photo Uploader with simulated Computer Vision
  function setupPhotoUploader() {
    const dropzone = document.getElementById('photo-dropzone');
    const fileInput = document.getElementById('file-photo-input');
    const previewBox = document.getElementById('cv-preview-box');
    const imageDisplay = document.getElementById('cv-image-display');
    const tagsContainer = document.getElementById('cv-tags-container');
    const hazardRating = document.getElementById('cv-hazard-rating');

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
          displayPhotoAI(evt.target.result, ['severe_structural_failure', 'immediate_hazard'], '4.8 / 5.0 (Critical)', 'W10', 'Roads & Mobility', 'Structural defect uploaded by citizen via photographic evidence.');
        };
        reader.readAsDataURL(file);
      }
    });

    document.getElementById('btn-sample-photo-pothole').addEventListener('click', () => {
      const p = samplePhotos.pothole;
      displayPhotoAI(p.url, p.tags, p.hazard, p.ward, p.cat, p.desc);
    });

    document.getElementById('btn-sample-photo-school').addEventListener('click', () => {
      const p = samplePhotos.school;
      displayPhotoAI(p.url, p.tags, p.hazard, p.ward, p.cat, p.desc);
    });

    document.getElementById('btn-sample-photo-phc').addEventListener('click', () => {
      const p = samplePhotos.phc;
      displayPhotoAI(p.url, p.tags, p.hazard, p.ward, p.cat, p.desc);
    });

    function displayPhotoAI(url, tags, hazard, ward, cat, desc) {
      previewBox.style.display = 'flex';
      imageDisplay.src = url;
      tagsContainer.innerHTML = tags.map(t => `<span class="cv-tag">#${t}</span>`).join('');
      hazardRating.innerHTML = `CV Hazard Rating: <strong>${hazard}</strong>`;

      // Pre-fill formal form
      document.getElementById('form-ward-select').value = ward;
      document.getElementById('form-category-select').value = cat;
      document.getElementById('form-issue-desc').value = desc;
    }
  }

  // Interactive WhatsApp Bot Simulation
  function setupWhatsAppBot() {
    const input = document.getElementById('wa-user-input');
    const sendBtn = document.getElementById('btn-wa-send');
    const chatBody = document.getElementById('wa-chat-messages');

    function appendMessage(text, isUser = false) {
      const bubble = document.createElement('div');
      bubble.className = `wa-bubble ${isUser ? 'wa-user' : 'wa-bot'}`;
      bubble.textContent = text;
      chatBody.appendChild(bubble);
      chatBody.scrollTop = chatBody.scrollHeight;
    }

    function processUserInput() {
      const userText = input.value.trim();
      if (!userText) return;

      appendMessage(userText, true);
      input.value = '';

      setTimeout(() => {
        const lower = userText.toLowerCase();
        if (waState.step === 0) {
          // Identify ward or ask
          if (lower.includes('gohiria') || lower.includes('ward 4') || lower.includes('4')) {
            waState.ward = 'W04';
            waState.step = 1;
            appendMessage('Understood: Ward 04 (Gohiria). What civic problem or development project is needed in your area?');
          } else if (lower.includes('jatni') || lower.includes('tamando') || lower.includes('7')) {
            waState.ward = 'W07';
            waState.step = 1;
            appendMessage('Noted: Ward 07 (Jatni Outskirts). What civic problem would you like to report?');
          } else if (lower.includes('retang') || lower.includes('10')) {
            waState.ward = 'W10';
            waState.step = 1;
            appendMessage('Understood: Ward 10 (Retang Industrial Belt). What is the urgent infrastructure issue?');
          } else {
            waState.ward = 'W04';
            waState.step = 1;
            appendMessage(`Location recorded (${userText}). Please describe your development need or emergency.`);
          }
        } else if (waState.step === 1) {
          waState.complaint = userText;
          waState.step = 2;
          
          let detectedCategory = 'Public Infrastructure';
          if (lower.includes('school') || lower.includes('पढ़ा') || lower.includes('ସ୍କୁଲ')) detectedCategory = 'Education';
          else if (lower.includes('health') || lower.includes('doctor') || lower.includes('ଡାକ୍ତର')) detectedCategory = 'Healthcare';
          else if (lower.includes('road') || lower.includes('pothole') || lower.includes('ରାସ୍ତା')) detectedCategory = 'Roads & Mobility';
          else if (lower.includes('water') || lower.includes('ପାଣି')) detectedCategory = 'Water & Sanitation';
          else if (lower.includes('job') || lower.includes('skill') || lower.includes('iti')) detectedCategory = 'Youth & Skilling';

          appendMessage(`Dhanyabad! Your priority for [${detectedCategory}] in Ward ${waState.ward} has been registered into the Prashasan Decision Intelligence Database. Ticket: #WA-${Math.floor(1000 + Math.random() * 9000)}. Priority urgency score: 4.8/5.0.`);

          // Also populate the form
          document.getElementById('form-ward-select').value = waState.ward;
          document.getElementById('form-category-select').value = detectedCategory;
          document.getElementById('form-issue-desc').value = `[Via WhatsApp Civic Bot] ${userText}`;
        } else {
          appendMessage('Your previous submission has already been routed to the District Planning Committee. Would you like to report another issue?');
          waState.step = 0;
        }
      }, 700);
    }

    sendBtn.addEventListener('click', processUserInput);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') processUserInput();
    });
  }

  // Formal Submission Form Handler
  function setupSubmissionForm() {
    const form = document.getElementById('form-citizen-submission');
    const toast = document.getElementById('submission-toast');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const ward_id = document.getElementById('form-ward-select').value;
      const category = document.getElementById('form-category-select').value;
      const raw_input = document.getElementById('form-issue-desc').value.trim();

      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'web',
            language: currentLanguage,
            ward_id: ward_id,
            raw_input: raw_input
          })
        });

        const data = await res.json();
        const ticketId = data.submission?.id || `SUB-2026-${Math.floor(200 + Math.random() * 800)}`;

        toast.style.display = 'block';
        toast.innerHTML = `<strong>Success!</strong> ${i18n[currentLanguage]?.toastSuccess || 'Ticket Logged: '} <strong>${ticketId}</strong> (Urgency: ${data.submission?.urgency_score || '4.8'}/5.0)`;
        
        // Confetti effect
        if (window.confetti) {
          window.confetti({ particleCount: 60, spread: 55, origin: { y: 0.8 } });
        }

        // Notify app to refresh Prashasan Dashboard data
        if (window.App && typeof window.App.refreshDashboardData === 'function') {
          window.App.refreshDashboardData();
        }

        // Reset form textarea after 3 seconds
        setTimeout(() => {
          document.getElementById('form-issue-desc').value = '';
        }, 2000);

      } catch (err) {
        console.error('Submission error:', err);
        toast.style.display = 'block';
        toast.style.color = '#F43F5E';
        toast.textContent = 'Submission error. Please check connectivity.';
      }
    });
  }

  return { init, i18n };
})();
