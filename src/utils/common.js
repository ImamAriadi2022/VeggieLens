export const logError = (context, error) => {
  console.error(`❌ ${context}:`, error);
};

export const isWebGPUSupported = () => {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
};

export const isMobileDevice = () => {
  return navigator.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

export const createDelay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const validateModelMetadata = (metadata) => {
  return metadata && metadata.labels && Array.isArray(metadata.labels);
};

export const getCameraErrorMessage = (error) => {
  const errorMessages = {
    'NotAllowedError': 'Izin kamera ditolak. Harap izinkan akses kamera.',
    'NotFoundError': 'Tidak ada kamera ditemukan pada perangkat ini.',
    'NotReadableError': 'Kamera sedang digunakan oleh aplikasi lain.'
  };

  return errorMessages[error.name] || 'Gagal memulai kamera';
};

const INDONESIAN_VEGGIE_NAMES = {
  beetroot: 'Bit',
  paprika: 'Paprika',
  cabbage: 'Kubis',
  carrot: 'Wortel',
  cauliflower: 'Kembang Kol',
  chilli: 'Cabai',
  corn: 'Jagung',
  cucumber: 'Mentimun',
  eggplant: 'Terong',
  garlic: 'Bawang Putih',
  ginger: 'Jahe',
  lettuce: 'Selada',
  onion: 'Bawang Merah',
  peas: 'Kacang Polong',
  potato: 'Kentang',
  turnip: 'Lobak',
  soybean: 'Kedelai',
  spinach: 'Bayam'
};

export const translateVegetableName = (rawName) => {
  if (!rawName) return rawName;
  const key = rawName.toLowerCase().trim();
  return INDONESIAN_VEGGIE_NAMES[key] || rawName;
};

export const INDONESIAN_FACTS_BY_TONE = {
  wortel: {
    normal: 'Wortel kaya akan beta-karoten yang diubah tubuh menjadi Vitamin A untuk menjaga kesehatan mata dan memperkuat daya tahan tubuh.',
    funny: 'Tahukah kamu? Wortel dulu berwarna ungu dan kuning sebelum versi jingga yang ceria jadi bintang utama di meja makan!',
    professional: 'Secara botani, Daucus carota kaya akan karotenoid, lutein, dan falcarinol yang berperan sebagai antioksidan alami.',
    casual: 'Rutin makan wortel bikin penglihatan tajam dan kulit makin segar alami, pas banget buat camilan sehat sehari-hari!'
  },
  kentang: {
    normal: 'Kentang merupakan sumber karbohidrat bebas gluten yang kaya akan Vitamin B6, C, serta Kalium untuk stamina harian.',
    funny: 'Kentang adalah satu-satunya sayuran yang pernah diajak jalan-jalan ke luar angkasa oleh NASA pada tahun 1995!',
    professional: 'Solanum tuberosum mengandung pati resisten (type 3 resistant starch) yang berfungsi sebagai prebiotik bagi usus.',
    casual: 'Kentang itu fleksibel banget! Mau direbus, dipanggang, atau dibuat sup, nutrisinya tetap bikin perut kenyang dan bertenaga.'
  },
  jagung: {
    normal: 'Jagung manis tinggi akan serat alami serta lutein dan zeaxanthin yang bermanfaat melindungi mata dari radiasi sinar UV.',
    funny: 'Satu tongkol jagung selalu memiliki jumlah baris biji yang genap. Coba hitung kalau tidak percaya!',
    professional: 'Zea mays mengandung antioksidan asam ferulat dan serat insolubel yang mendukung motilitas gastrointestinal.',
    casual: 'Jagung itu manisnya alami tanpa gula tambahan, enak banget dibakar atau dicampur ke dalam salad segar.'
  },
  mentimun: {
    normal: 'Mentimun mengandung sekitar 95% air yang sangat efektif menjaga hidrasi tubuh, menyegarkan kulit, serta meredakan panas dalam.',
    funny: 'Kalau suhu udara terasa panas, makanlah mentimun! Bagian dalam mentimun bisa 10 derajat lebih dingin dari udara sekitar.',
    professional: 'Cucumis sativus kaya akan cucurbitacin dan flavonoid fisetin yang berkontribusi pada perlindungan sel tubuh.',
    casual: 'Mentimun itu penolong pas cuaca terik! Iris tipis buat mata atau makan langsung biar badan adem seketika.'
  },
  terong: {
    normal: 'Terong kaya akan nasunin, yaitu antioksidan kuat pada kulit bahagian luarnya yang berfungsi melindungi membran sel otak.',
    funny: 'Secara ilmu botani, terong sebenarnya adalah buah beri raksasa yang menyamar sebagai sayuran di dapurmu!',
    professional: 'Solanum melongena kaya akan asam klorogenat dan antosianin yang memiliki efek anti-inflamasi dan cardioprotective.',
    casual: 'Terong balado atau terong panggang itu rasanya juara, plus antioksidannya bikin sel-sel tubuh tetap awet muda.'
  },
  bayam: {
    normal: 'Bayam dikenal sebagai sayuran hijau tinggi zat besi, asam folat, serta Vitamin K yang bagus untuk pembentukan sel darah merah.',
    funny: 'Popeye tidak bohong! Bayam memang punya kekuatan super nutrisi yang bikin otot dan sel tubuh makin bertenaga.',
    professional: 'Spinacia oleracea mengandung phytoecdysteroids dan nitrat organik yang meningkatkan efisiensi mitokondria otot.',
    casual: 'Semangkuk sup bayam bening itu segar banget, ramuan simpel buat balikin energi pas kamu lagi lelah.'
  },
  selada: {
    normal: 'Selada rendah kalori namun sangat kaya akan kadar air, serat, dan Vitamin K untuk mendukung kesehatan pencernaan dan tulang.',
    funny: 'Selada adalah raja salad yang paling santai—96% tubuhnya cuma air, jadi kamu makan sayur sambil minum air!',
    professional: 'Lactuca sativa mengandung senyawa lactucarium yang memiliki efek sedatif ringan dan menenangkan sistem saraf.',
    casual: 'Selada yang renyah bikin sandwich dan salad kamu makin meledak kesegarannya tanpa nambah beban kalori.'
  },
  cabai: {
    normal: 'Cabai mengandung kapsaisin alami yang memicu pelepasan hormon endorfin, meningkatkan metabolisme, serta menambah nafsu makan.',
    funny: 'Rasa pedas cabai sebenarnya bukan rasa, melainkan sinyal kebakaran palsu yang dikirim kapsaisin ke lidahmu!',
    professional: 'Capsicum annuum mengandung alkaloid capsaicinoid yang menstimulasi reseptor TRPV1 dan memicu efek termogenik.',
    casual: 'Sensasi pedas cabai itu bikin nagih karena tubuh langsung merilis endorfin yang bikin suasana hati mendadak gembira!'
  },
  'bawang putih': {
    normal: 'Bawang putih kaya akan senyawa alisin yang memiliki sifat antibakteri alami, membantu menurunkan tekanan darah dan kolesterol.',
    funny: 'Bawang putih adalah benteng pertahanan terbaik: bisa mengusir flu, menurunkan kolesterol, dan mungkin vampir juga!',
    professional: 'Allium sativum menghasilkan organosulfur allicin saat digeprek, yang berfungsi sebagai agen antimikroba kardiovaskular.',
    casual: 'Bumbu ajaib ini wajib ada di setiap masakan! Selain wangi, bawang putih jaga imunitas kamu tetap kebal penyakit.'
  },
  jahe: {
    normal: 'Jahe mengandung gingerol yang efektif menghangatkan saluran pencernaan, meredakan mual, serta mengurangi peradangan sendi.',
    funny: 'Jahe adalah penghangat tubuh alami paling setia—sekali teguk wedang jahe, dinginnya angin malam langsung kabur!',
    professional: 'Zingiber officinale mengandung bioactive 6-gingerol dan shogaol yang menekan sintesis prostaglandin pro-inflamasi.',
    casual: 'Pas lagi masuk angin atau tenggorokan gatal, seduhan jahe hangat itu seperti pelukan hangat buat tubuhmu.'
  },
  'bawang merah': {
    normal: 'Bawang merah kaya akan kuersetin, senyawa flavonoid antioksidan yang baik untuk imunitas tubuh dan kesehatan jantung.',
    funny: 'Bawang merah itu sayuran paling emosional di dapur—setiap kali diiris, dia pasti bikin kamu menangis haru!',
    professional: 'Allium cepa merupakan sumber kaya quercetin-4-glucoside dan fructooligosaccharides yang bersifat imunomodulator.',
    casual: 'Bawang goreng renyah di atas nasi hangat itu kenikmatan hakiki, plus antioksidannya bikin jantung tetap sehat.'
  },
  'kacang polong': {
    normal: 'Kacang polong adalah sumber protein nabati yang baik, kaya serat untuk menjaga kestabilan kadar gula darah dan usus.',
    funny: 'Kacang polong sangat kompak! Mereka selalu tinggal bersama secara damai di dalam satu polong yang nyaman.',
    professional: 'Pisum sativum mengandung lectin, saponin, dan vicilin yang menunjukkan aktivitas hipoglikemik dan hipolipidemik.',
    casual: 'Bentuknya imut dan rasanya manis gurih, kacang polong cocok banget ditabur ke nasi goreng atau sup kesukaanmu.'
  },
  lobak: {
    normal: 'Lobak memperlancar pencernaan dan mengandung senyawa glukosinolat yang membantu detoksifikasi alami pada organ hati.',
    funny: 'Lobak punya kemampuan super tak terlihat: dia bekerja diam-diam membersihkan racun di perutmu tanpa minta dipuji!',
    professional: 'Raphanus sativus mengandung isothiocyanate seperti sulforaphane yang memicu induksi enzim detoksifikasi fase II.',
    casual: 'Kuah sup lobak hangat itu rasanya bersih dan menenangkan, bikin perut terasa ringan dan lega setelah makan berat.'
  },
  kedelai: {
    normal: 'Kedelai merupakan sumber protein nabati lengkap dengan kandungan isoflavon yang bermanfaat bagi kesehatan jantung dan tulang.',
    funny: 'Kedelai adalah superhero protein nabati yang diam-diam menyamar menjadi tempe, tahu, dan susu lezat di meja makanmu!',
    professional: 'Glycine max mengandung 9 asam amino esensial, genistein, dan daidzein yang mendukung regulasi profil lipid darah.',
    casual: 'Kedelai itu fondasi kuliner Nusantara! Dari tahu, tempe sampai susu kedelai, semuanya kaya nutrisi juara.'
  },
  kubis: {
    normal: 'Kubis tinggi akan Vitamin C dan K serta mengandung senyawa fitokimia alami yang mendukung kesehatan dinding lambung.',
    funny: 'Kubis adalah sayuran berlapis paling misterius—kamu harus mengupasnya terus untuk menemukan inti kesegarannya!',
    professional: 'Brassica oleracea var. capitata kaya akan glutamin dan s-methylmethionine yang mempercepat penyembuhan mukosa lambung.',
    casual: 'Kubis renyah di dalam olahan tumis atau lalapan memberikan sensasi segar yang kaya akan Vitamin C alami.'
  },
  'kembang kol': {
    normal: 'Kembang kol kaya akan serat, Vitamin C, dan choline yang berperan penting dalam menjaga fungsi memori serta saraf otak.',
    funny: 'Kembang kol seperti kubis yang sedang mengenakan gaun bunga putih cantik untuk pergi ke pesta makan malam!',
    professional: 'Brassica oleracea var. botrytis tinggi akan choline dan glucobrassicin yang berperan dalam sintesis asetilkolin sel saraf.',
    casual: 'Kembang kol panggang atau tumis itu lezat banget, teksturnya unik dan kaya serat buat pencernaan lancar.'
  },
  paprika: {
    normal: 'Paprika kaya akan antioksidan dan mengandung kadar Vitamin C hingga tiga kali lebih banyak dibanding buah jeruk segar.',
    funny: 'Paprika warna-warni seperti lampu lalu lintas di piringmu—merah, kuning, hijau semuanya siap menutrisi tubuhmu!',
    professional: 'Capsicum annuum grossum mengandung asam askorbat tinggi, kapsantin, dan karotenoid yang menangkal stres oksidatif.',
    casual: 'Paprika bikin masakan makin estetik dan berwarna, plus bonus Vitamin C melimpah untuk imun tubuh yang kuat.'
  },
  bit: {
    normal: 'Buah bit mengandung nitrat organik alami yang membantu melebarkan pembuluh darah dan melancarkan sirkulasi darah.',
    funny: 'Hati-hati saat memotong buah bit! Warnanya yang merah merona suka membuat pisau dan tanganmu berdandan jadi merah.',
    professional: 'Beta vulgaris mengandung betalain pigmen dan nitrat anorganik yang terbukti meningkatkan stamina dan efisiensi VO2 max.',
    casual: 'Jus buah bit itu booster stamina alami yang mantap banget diminum sebelum olahraga atau aktivitas padat.'
  }
};

export const getIndonesianFunFact = (rawName, tone = 'normal') => {
  const name = translateVegetableName(rawName);
  const key = name.toLowerCase().trim();
  const vegFacts = INDONESIAN_FACTS_BY_TONE[key];
  if (vegFacts && vegFacts[tone]) {
    return vegFacts[tone];
  }
  if (vegFacts && vegFacts.normal) {
    return vegFacts.normal;
  }
  return `Sayuran ${name} kaya akan serat alami, vitamin, dan antioksidan penting yang bermanfaat bagi kesehatan tubuh.`;
};
