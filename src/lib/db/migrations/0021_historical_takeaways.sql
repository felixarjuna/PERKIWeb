-- One-time data migration: publish the 40 historical takeaways (notes and TL;DR)
-- from 2026-01-03 to 2026-10-10, imported from the writing team's Google Docs (see
-- docs/takeaway-import.md). Each entry matches its gathering by Aachen date and type, never
-- by id, and is only added when that gathering has no takeaway yet, so rerunning it or
-- running it on a database without these gatherings (tests, a fresh dev database) adds
-- nothing. Writers are unknown, so the takeaways have no author and no contributors.
INSERT INTO "takeaways" ("scheduleId", "keypoints", "tldr", "contributors", "status", "publishedAt")
SELECT s."id", i."keypoints", i."tldr", '[]'::json, 'published', now()
FROM (VALUES
  ('2026-01-03', 'bible_study', $notes$### **03-01-2026: What Are We Complaining? (Habakuk 1:2-2:5)**

PA Besar: Aldi

Habakuk adalah salah satu nabi yang hidup pada zaman kerajaan Yehuda sebelum masa pembuangan Babel. Pada saat itu, ia marah dan mengeluh kepada Allah atas perbuatan bangsa Yehuda dimana banyak sekali kejahatan yang terjadi. Ia menganggap Allah tidak mendengar dan tidak peduli dengan kondisi Yehuda saat itu (1:2-4). Sebagai respon, Allah mengirim bangsa Kasdim (Babel) untuk menghukum perbuatan bangsa Yehuda (1:5-11). Akan tetapi, ia merasa dirinya (juga bangsa nya) lebih baik dari bangsa Kasdim. Sehingga menurutnya, bangsa Kasdim tidak layak dipakai Allah untuk menghukum bangsa Yehuda (1:12-17).

Ada beberapa poin yang bisa kita renungkan dari interaksi Habakuk dengan Allah, seperti:

1. Bolehkah aku mengeluh?

Dari kisah Habakuk seringkali muncul pertanyaan di benak kita. Apakah boleh kita mengeluh kepada Allah dalam doa kita? Sebelum menjawab pertanyaan ini, mari kita melihat dari sisi Habakuk saat ia mengeluh kepada Allah. Habakuk memulai keluhannya dengan pengenalan akan Allah, dimana ia memulai dengan menyebutkan sifat Allah yang maha adil dan kudus, yang berarti kelaliman tidak ditolerir oleh Allah (1:12-13). Hal ini membuktikan bahwa Habakuk mempunyai relasi yang baik dengan Allah sehingga peka dengan sifat-sifat Allah. Ketika kita sudah mempunyai relasi yang baik, maka keluhan kita tidak lagi berdasarkan hal-hal duniawi saja, tetapi karena kesadaran akan pengharapan akan rencana Allah.

1. Apakah kita semakin mengenal Allah, atau memaksakan kehendak kita dalam rencana Nya?

Sebaliknya, Allah pun juga merupakan sosok yang menginginkan relasi, dimana Ia juga mendengar setiap keluhan kita dan juga ada sebuah respon yang Ia berikan. Akan tetapi, karena Allah adalah sosok *higher being*, maka respon yang Allah berikan kepada kita juga berbeda. Respon Allah adalah dengan mengungkapkan rencana Nya pada kita, dalam bentuk kejadian atau momen yang terjadi dalam hidup kita. Rencana Allah pun pada kisah ini akhirnya akan sesuai dengan standar dan sifat yang Ia miliki, dengan Ia menghukum kesalahan bangsa Babel (2:6-20).

1. And the Righteous shall live by faith

Dalam menanggapi respon Allah, seringkali kita merasa bahwa jawaban-Nya terlambat, atau tidak sesuai dengan yang kita harapkan. Akan tetapi apapun fase kehidupan yang kita alami, semua adalah rancangan terbaik dari Allah, dan Ia selalu memberikan jawaban-Nya tepat pada waktunya. Yang harus kita lakukan hanyalah percaya dan hidup dalam jembatan iman, seperti yang dilakukan oleh Habakuk. Ia berkeinginan untuk lebih dekat dengan Allah dan berjaga-jaga akan jawaban-Nya (2:1). Respon Allah kepada penantian Habakuk juga menggambarkan sifat Allah yang setia akan rencana-Nya, walau tidak terlihat sekarang, namun akan terjadi sesuai kehendak-Nya. Untuk itu Allah menyuruh Habakuk mengukir penglihatan tersebut dalam loh-loh supaya orang-orang dapat melihatnya. Allah pun juga menasihati Habakuk, bahwa orang benar hidup oleh percayanya (2:4)

Sebagai kesimpulan, kita diajak untuk melihat diri masing-masing, apakah kita sejatinya sudah memiliki relasi dan pengenalan akan Allah? Apakah doa dan pengharapan kita sudah sesuai dengan karakter Tuhan? Dan kalau begitu, apakah kita sudah siap untuk selalu mempunyai pengharapan kepada Allah, dan bisa memberikan seluruh kontrol hidup kita kepada -ya?$notes$, $tldr$### **TL;DR PA Besar 03.01.2026 : What Are We Complaining (Habakuk 1:2-2:5)**

PA Besar : Aldi

Dalam kehidupan sehari-hari, beberapa kali mungkin kita pernah mempertanyakan atau bahkan mengeluh akan rencana Allah dalam kehidupan kita. Kali ini Habakuk memberi contoh kepada kita melalui keluhannya yang ia mulai dengan menyatakan sifat Allah (yang maha adil dan kudus) dimana kelaliman tidak ditolerir-Nya. Kita bisa melihat bahwa Habakuk sudah lebih dulu mempunyai relasi yang begitu dekat dengan Allah, sehingga keluhannya bukan semata berdasarkan ketidakpuasan duniawi saja, melainkan berdasarkan pengenalannya akan Allah. Bentuk relasi seperti inilah yang sangat diinginkan oleh Allah, karena Ia mendengar keluhan umat-Nya, dan Ia juga menginginkan dialog dengan manusia.

Jawaban Allah mungkin tidak berbentuk kata-kata, tetapi dalam bentuk rencana yang sudah ditetapkan-Nya untuk kehidupan kita. Seringkali kita merasa kalau jawaban dari Allah terlambat atau tidak sesuai, tetapi yang patut kita ketahui, Allah selalu memberikan rencana-Nya sesuai dengan ketetapan-Nya dan selalu tepat pada waktunya.

Sebagai respon akan rencana Allah, kita juga bisa mencontoh Habakuk, bagaimana ia ingin dekat dengan-Nya dan berjaga-jaga akan jawaban yang Allah berikan. Kitapun sebagai umat Allah diminta untuk percaya dan hidup dalam jembatan iman, karena orang benar hidup oleh percayanya.

Lalu, apakah kita sejatinya sudah memiliki relasi dan pengenalan akan Allah? Apakah doa dan pengharapan kita sudah sesuai dengan karakter Tuhan? Dan kalau begitu, apakah kita sudah siap untuk selalu mempunyai pengharapan kepada Allah, dan bisa memberikan seluruh kontrol hidup kita kepada Nya? Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-01-10', 'church_service', $notes$### **10-01-2026: Puji Tuhan walau hidup tidak baik baik saja (Habakuk 3:1-19)**

Ibadah: Pdt. John

Habakuk merupakan seorang yang jujur membawa keluh kesahnya kepada Tuhan. Dalam pasal 1, Habakuk mengeluh karena melihat ketidakadilan di tengah umat Yahudi, di mana orang miskin ditindas oleh orang kaya. Situasi ini membuatnya bertanya kepada Tuhan mengapa hidup berjalan seperti itu. Jawaban Tuhan tidak sesuai dengan harapan Habakuk, karena Tuhan menyatakan akan mendatangkan bangsa Kasdim (Babel) untuk menghukum umat Yahudi. Habakuk tidak terima karena ia merasa bangsa Kasdim tidak layak untuk menghukum umat pilihan Allah karena mereka pun telah melakukan banyak kejahatan. Namun di sisi lain, hal ini membuat Habakuk takut akan masa depan.

Dalam pasal 3 terjadi perubahcan besar dalam diri Habakuk. Ia justru memuji dan menyembah Tuhan. Hatinya diubahkan dan ia memahami bahwa iman bukan berarti tidak memiliki rasa takut, melainkan datang kepada Tuhan di tengah ketakutan. Habakuk mengakui bahwa ia takut setelah mendengar rencana Tuhan, namun justru dalam ketakutan itu ia berdoa dan mendekat kepada Tuhan, sama seperti yang pernah dilakukan Musa. Ketakutan adalah hal yang wajar, tetapi yang terpenting adalah ke mana ketakutan itu dibawa, apakah kepada Tuhan atau kepada hal lain.

Habakuk juga mengingat kembali karya Tuhan di masa lalu, bagaimana Tuhan bekerja di tengah umat-Nya dengan membebaskan orang Israel. Dengan mengingat kembali proses penyertaan dan mujizat Tuhan, iman dapat dikuatkan di tengah kesulitan dan dapat memberikan pengharapan di masa mendatang. Mengingat perbuatan Tuhan di masa lampau penting karena Tuhan yang setia di masa lalu akan tetap setia di masa yang akan datang. Pada akhirnya, Habakuk menyatakan bahwa sukacita sejati tidak bergantung pada keadaan atau situasi hidup yang aman, melainkan pada Tuhan sendiri. Ia bersukacita bukan karena hidupnya baik-baik saja, tetapi karena Tuhan itu baik. Iman bukan berarti tidak ada persoalan dalam hidup, namun tentang Tuhan yang setia menyertai kita.$notes$, $tldr$### **TL;DR Ibadah 10.01.2026 : Puji Tuhan,walau hidup tidak baik baik saja (Habakuk 3:1-19)**

Ibadah: Pdt.John

Habakuk hidup di tengah ketidakadilan, menyaksikan orang miskin ditindas oleh yang kaya, sehingga ia mengeluh kepada Tuhan. Jawaban Tuhan tidak sesuai harapannya karena Ia menyatakan akan mendatangkan bangsa Kasdim untuk menghukum bangsa Yehuda, yang membuat Habakuk takut. Namun, di pasal 3 terjadi perubahan besar dalam hatinya; ia justru memuji dan menyembah Tuhan. Ia menyadari bahwa iman bukan berarti tidak takut, melainkan mendekat kepada Tuhan di tengah ketakutan.

Dengan mengingat kembali karya dan mujizat Tuhan di masa lalu, Habakuk belajar bahwa iman dapat dikuatkan meski situasi sulit. Dengan mengingat kembali proses penyertaan dan mujizat Tuhan, iman dapat dikuatkan di tengah kesulitan dan dapat memberikan pengharapan di masa mendatang. Selain itu, sukacita sejati baginya bukan berasal dari kenyamanan atau keamanan hidup, melainkan dari percaya dan bersyukur kepada Tuhan yang baik, meskipun hidup tidak berjalan sempurna.

Di tengah ketakutan yang kita alami, kemanakah kita membawanya? Kepada Tuhan atau kepada hal yang lain? Mari kita mengingat penyertaan Tuhan dan tetap bersukacita dalam-Nya karena Tuhan setia dan tak pernah meninggalkan! Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-01-17', 'bible_study', $notes$### **17-01-2026: Called Watchman for the Rebellious (Yehezkiel 1:1-3, 2:1-10, 3:1-21)**

PA Besar: Victor

Yehezkiel adalah seorang nabi besar yang dipanggil Tuhan pada masa pembuangan bangsa Israel di Babel, di tengah kondisi rohani umat Israel yang rusak dan memberontak. Di tengah kondisi yang gelap inilah Tuhan mengutus Yehezkiel dengan sebuah peran khusus, yaitu sebagai "penjaga" (*watchman*) bagi kaum Israel (3:17).

Sebagai seorang penjaga, Yehezkiel bertugas untuk mendengarkan firman Tuhan dan menyampaikannya kepada umat Israel sebagai peringatan agar mereka bertobat. Tuhan menegaskan bahwa tugas ini berkaitan langsung dengan nyawa. Jika seorang penjaga melihat bahaya atau dosa tetapi tidak memperingatkan orang yang bersalah, maka orang itu akan mati dalam kesalahannya, dan darahnya akan dituntut dari tangan penjaga tersebut. Sebaliknya, jika penjaga telah memperingatkan tetapi orang itu tetap tidak mau mendengar, maka penjaga itu telah melakukan tanggung jawabnya dan menyelamatkan nyawanya sendiri. Dengan demikian, Tuhan menegaskan bahwa keberhasilan pelayanan tidak diukur dari respons manusia, melainkan dari ketaatan dalam menyampaikan kebenaran.

Sebelum Yehezkiel diutus untuk berbicara, Tuhan mempersiapkannya dengan memerintahkan Yehezkiel untuk memakan gulungan kitab yang berisi nyanyian ratapan, keluhan, dan rintihan (2:10; 3:1–3). Walaupun isi kitab tersebut berat dan penuh teguran, gulungan itu terasa manis seperti madu di mulut Yehezkiel. Tindakan ini menggambarkan bahwa seorang hamba Tuhan harus terlebih dahulu menerima, menyelidiki, dan menghidupi firman sebelum memberitakannya kepada orang lain. Seperti perintah Tuhan kepada Yehezkiel untuk memberikan telinganya dan menaruh seluruh firman itu di dalam hatinya (3:10) sebagai dasar pelayanannya. Tuhan bahkan membuat Yehezkiel menjadi bisu, kecuali ketika Tuhan sendiri membuka mulutnya dan mau menyampaikan firman-Nya. Hal ini mengajarkan bahwa firman yang disampaikan harus murni berasal dari Tuhan, bukan dari keinginan atau agenda pribadi.

Tantangan terbesar Yehezkiel adalah umat yang kepadanya ia diutus, yang disebut Tuhan sebagai "bangsa pemberontak". Mereka memiliki hati yang keras dan tidak mau mendengar. Namun, Tuhan tidak membiarkan Yehezkiel takut atau gentar menghadapi wajah mereka (2:6). Tuhan memperlengkapi Yehezkiel dengan membuat dahinya teguh "sekeras batu intan", supaya ia tidak goyah atas penolakan mereka (3:8-9). Tangan Tuhan menyertai Yehezkiel dengan kuat, bahkan ia merasakan "panas hati" yang selaras dengan kemarahan dan keadilan Tuhan terhadap dosa.

Sebagai refleksi, kisah Yehezkiel menantang setiap kita untuk memeriksa motivasi pelayanan kita. Ketika kita menegur atau menasihati orang lain, apakah itu benar-benar berisi firman Tuhan atau hanya luapan emosi dan keinginan pribadi? Menjadi penyambung lidah Allah berarti siap untuk taat sepenuhnya, menyelidiki firman-Nya dengan sungguh-sungguh, dan memiliki keberanian untuk menyuarakan kebenaran meskipun dunia menolak atau memberontak. Jangan sampai kita mengurangi ketajaman firman Tuhan hanya untuk mengerti hati manusia dan bukan hati Tuhan!$notes$, $tldr$### **TL;DR PA Besar 17.01.2026 : Called Watchman for the Rebellious (Yehezkiel 1:1-3, 2:1-10, 3:1-21)**

PA Besar : Victor

Yehezkiel dipanggil Tuhan di tengah kondisi umat Israel yang memberontak dan tidak menaati firman Tuhan. Ia dipilih menjadi penjaga (*watchman*), bukan untuk menyenangkan manusia, tetapi untuk menyampaikan apa yang Tuhan firmankan dan mengingatkan umat Israel agar bertobat. Pelayanan ini adalah soal pertanggungjawaban dan ketaatan kepada Tuhan, bukan soal apakah orang mau mendengar atau tidak.

Melalui teladannya, kita belajar tentang ketaatan Yehezkiel yang penuh. Ia hanya berbicara ketika Tuhan mengizinkan dan menyampaikan apa yang Tuhan kehendaki, bukan keinginannya sendiri. Perintah untuk memakan gulungan kitab mengingatkan kita bahwa firman Tuhan harus terlebih dahulu kita selidiki dan hidupi sebelum kita sampaikan kepada orang lain. Tuhan pun memperlengkapi Yehezkiel dengan keteguhan hati agar ia tidak gentar menghadapi penolakan dari bangsa yang keras hati.

Renungan ini mengajak kita untuk menjadi penjaga yang setia: taat pada firman Tuhan, berani menyampaikannya meski tidak diterima, dan melakukannya dengan hati yang peduli. Jangan sampai kita mengurangi ketajaman firman Tuhan hanya untuk mengerti hati manusia dan bukan hati Tuhan! Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-01-24', 'church_service', $notes$### **24-01-2026: Hidup yang Lapar Atau Hidup yang Dipulihkan? (Yehezkiel 4:1-17)**

Ibadah: Pdt. John

Apa jadinya saat seseorang menjalani hidupnya tanpa Tuhan, di luar Dia? Mereka akan mengalami kelaparan dan kelelahan rohani! Bahkan saat hidupnya tampak baik-baik saja, tanpa Tuhan hidup mereka akan terasa kosong. Kita bisa menyaksikan hal ini dalam kehidupan bangsa Israel.

Di masa itu bangsa Israel, terdiri dari Israel Utara dan Selatan (Yehuda), masih terus melakukan kejahatan, ketidakadilan serta penyembahan berhala -seperti yang dilakukan nenek moyang mereka-. Melihat ini, Tuhan mengutus Yehezkiel untuk memperingatkan Israel untuk bertobat! Untuk memberitakan hal ini Yehezkiel pun memakai beberapa cara, salah satunya lewat gestur/pemeragaan simbolik, sesuai Firman Tuhan (pasal 4). Hal ini kemungkinan diperlukan karena kekerasan hati Israel, sehingga kata-kata saja tidak cukup!

Apa hasil dosa Israel? Pertama, mereka terpisah dari Allah, karena Ia kudus dan tidak bisa bersatu dengan dosa. Setiap dosa punya konsekuensi, karena itu tidak bisa dianggap ringan! Bahayanya lagi, dosa yang terus dilakukan akan mengeraskan hati seseorang; bangsa Israel yang terus melakukan dosa akhirnya sulit untuk menyadari dosa mereka dan sulit bertobat. Jangan sampai kita mengulangi kesalahan yang sama! Apapun dosa yang masih kita lakukan, jangan normalisasi itu tapi bertobatlah dan bereskan itu di hadapan Tuhan, karena dosa yang dikompromikan sama seperti kehancuran yang ditunda.

Keterpisahan dari Tuhan ini membawa bencana bagi Israel: mereka jadi kelaparan, baik secara jasmani ataupun rohani (ay. 9-17). Karena tidak menaati Tuhan, akhirnya Israel akan dihancurkan bangsa lain (nubuat di pasal 4), dan mereka akan mengalami kelaparan. Persediaan makanan mereka terputus, tapi terlebih lagi mereka juga hidup dalam kecemasan (ay. 16-17)! Ini menunjukkan bahwa hidup tanpa Tuhan tidak akan membuahkan kepuasan sejati. Orang yang memilih berdosa mungkin merasa dirinya (nafsunya) dipuaskan, tapi pada akhirnya ia akan terus lapar!

Berita baiknya, sama seperti Yehezkiel yang menanggung hukuman Israel secara simbolis (ay. 4), Tuhan Yesus juga menanggung hukuman atas dosa-dosa kita di atas kayu salib! Ia juga yang merupakan Sang Roti Hidup, menawarkan kepenuhan bagi jiwa kita. Perbuatan Yehezkiel menunjukkan betapa beratnya konsekuensi dari dosa, namun salib Kristus menunjukkan betapa besar anugerahNya. Maka, jika kita sekarang sudah menerima anugerahNya, maukah kita -seperti Yehezkiel- menyebarkan berita baik ini kepada dunia yang kelaparan?$notes$, $tldr$### **TL;DR Ibadah 24.01.2026 : Hidup yang Lapar Atau Hidup yang Dipulihkan? (Yehezkiel 4:1-17)**

Ibadah : Pdt. John

Bagaimana jadinya jika seseorang hidup tanpa Tuhan? Sejarah kehidupan bangsa Israel bisa jadi studi kasus bagi kita! Di masa pelayanan Yehezkiel, mereka masih hidup dalam dosa: menyembah berhala, berbuat kekerasan, kejahatan dan ketidakadilan. Tuhan pun mengutus Yehezkiel untuk memperingati mereka buat bertobat; kali ini tidak hanya dengan kata-kata, tapi lewat gestur, analogi dan perumpamaan.

Apa isi peringatan Tuhan kepada Israel? Bahwa dosa Israel telah memisahkan mereka dari Dia, Allah yang Kudus. Juga bahwa Allah akan memakai bangsa lain (Babel) untuk menaklukkan mereka, sehingga mereka akhirnya kelaparan, baik secara jasmani maupun rohani -mereka terus merasa cemas-. Dari sini kita belajar bahwa hidup tanpa Tuhan serta kompromi terhadap dosa, hanya akan menuntun pada kehancuran, bukan kepuasan sejati!

Ini jadi peringatan bagi kita untuk bertobat dan membereskan dosa kita di hadapan Tuhan. Tapi, seperti Yehezkiel yang menanggung hukuman Israel -secara simbolik-, ingatlah juga bahwa Tuhan Yesus telah mati menanggung dosa-dosa kita di atas kayu salib! Ia juga yang bisa memberi kita kepuasan sejati. Inilah kabar baik yang bisa menguatkan kita dan juga kita sebarkan ke dunia yang kelaparan! Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-01-31', 'bible_study', $notes$### **31-01-2026: Yehezkiel III (Yehezkiel 36:16-38)**

PA Besar: Danny

Bangsa Israel telah mendapat banyak peringatan melalui nabi Yehezkiel, baik secara lisan maupun melalui peragaan simbolis. Bangsa Israel tidak mau mendengar dan bertobat sehingga mereka menderita oleh karena dosa-dosa mereka seperti: menyembah berhala, melakukan penindasan, dan ketidakadilan. Mereka dapat berbuat dosa sesuka hati karena mereka beranggapan bahwa Allah tidak melihat mereka dan pergi meninggalkan mereka (Yeh 9:9-10).

Tingkah laku mereka menajiskan tanah yang Allah berikan bagi mereka, sehingga Allah mencerai-beraikan umat Israel ke semua negeri (36:19). Pada saat berada di negeri lain pun kehadiran mereka menajiskan nama Allah, dalam pengertian bahwa bangsa lain menganggap Allah tidak mampu melindungi umat-Nya karena mereka harus meninggalkan tanahnya. Allah sakit hati karena nama-Nya yang kudus dinajiskan oleh kaum Israel di tengah bangsa-bangsa yang mereka datangi (36:21). Oleh karena itu, Allah ingin mengembalikan kemuliaan nama-Nya yang sudah tercoreng (36:23) melalui suatu janji pembaharuan dan pemulihan kepada umat-Nya (36:24-36).

Janji pembaharuan dan pemulihan Allah kepada umat Israel:

1. Allah akan mengumpulkan umat-Nya yang telah tersebar dimana-mana dan membawa mereka kembali ke tanah mereka (36:24).
2. Allah menjanjikan suatu perubahan hati maupun batin kepada umat-Nya melalui air yang mentahirkan dan Roh yang baru yang akan diam dalam umat-Nya, sehingga mereka mau menurut dan berpegang pada firman-Nya.
3. Allah akan memberkati mereka dengan mencukupkan kebutuhan mereka sehingga mereka tidak akan kelaparan lagi.
4. Allah akan mengembalikan keadaan kota-kota Israel yang telah hancur.

Pada ayat 22 dan 32, Allah menegaskan bahwa Ia melakukan pemulihan ini bukan karena kebaikan atau kehebatan orang Israel, melainkan agar bangsa-bangsa yang lain mengetahui bahwa Tuhan-lah Allah yang benar. Hal ini pun sekaligus ingin menyatakan bahwa mereka sebenarnya tidak pantas untuk menerima berkat dan pemulihan yang dijabarkan di ayat 24-36. Sama seperti kita yang diberi anugerah keselamatan walaupun sebenarnya kita tidak pantas untuk menerimanya. Lalu bagaimana respons kita akan hal ini? Jangan sampai kehadiran kita di antara sesama membuat nama-Nya menjadi najis!

Janji Allah akan perubahan hati dan batin melalui Roh-Nya yang kudus juga berlaku bagi kita. Indikator dari adanya perubahan hati dan batin dalam diri adalah bahwa kita teringat akan dosa-dosa kita dan merasa jijik akannya, sehingga kita bertobat dan berbalik pada Tuhan. Apakah sudah ada perubahan dalam hati dan batin kita? Apakah Roh-Nya sudah diam dalam diri kita? Tuhan ingin agar kita bertobat karena Ia tidak ingin bahwa seseorang mati karena dosanya (Yeh 18:31-32), Ia ingin agar kita hidup!$notes$, $tldr$### **TL;DR PA Besar 31.01.2026 : Yehezkiel III (Yehezkiel 36:16-38)**

PA Besar: Danny

Bangsa Israel telah mendapat banyak peringatan melalui nabi Yehezkiel, baik secara lisan maupun melalui peragaan simbolis. Namun, mereka tidak mau mendengar dan bertobat, sehingga Allah menghukum mereka dengan kekurangan dan kelaparan, serta mencerai-beraikan umat Israel ke semua negeri karena mereka menajiskan tanah yang Allah berikan bagi mereka (36:19). Pada saat berada di negeri lain pun kehadiran mereka menajiskan nama Allah.

Allah ingin mengembalikan kemuliaan nama-Nya yang sudah tercoreng di antara bangsa-bangsa lain melalui suatu janji pembaharuan dan pemulihan kepada umat-Nya (36:23-36). Suatu pemulihan yang bukan karena kebaikan atau kehebatan orang Israel (36:22,32), melainkan untuk menyatakan bahwa Tuhan-lah Allah yang benar.

Allah menjanjikan suatu perubahan hati dan batin melalui Roh-Nya yang kudus kepada bangsa Israel. Hal ini pun juga berlaku bagi kita! Indikator dari adanya perubahan hati dan batin dalam diri adalah bahwa saat kita teringat akan dosa-dosa kita, kita merasa jijik akannya, sehingga bertobat dan berbalik pada Tuhan. Apakah sudah ada perubahan dalam hati dan batin kita? Apakah Roh-Nya sudah diam dalam diri kita? Tuhan ingin agar kita bertobat karena Ia tidak ingin seseorang mati karena dosanya (Yeh. 18:31-32), Ia ingin agar kita hidup! Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-02-07', 'bible_study', $notes$### **07-02-2026: Daniel I (Daniel 1:1-21)**

PA Besar: Steffen

Sekitar tahun 772 BC, Israel kala itu terbagi menjadi dua bagian, utara dan selatan (Yehuda). Pada waktu itu juga, Yehuda dikepung oleh bangsa Babel pimpinan raja Nebukadnezar. Selain bertujuan untuk menguasai bangsa Israel, ia juga mengumpulkan orang-orang muda keturunan bangsawan atau raja Israel supaya dididik dan diubah identitasnya sesuai dengan ajaran-ajaran bangsa Babel, untuk nantinya dipekerjakan di istana raja (ay. 3-4).

Daniel, yang juga merupakan bagian dari golongan bangsawan Yehuda, dipilih oleh sang raja bersama beberapa orang Yehuda lainnya (seperti Hananya, Misael, dan Azarya) untuk menjadi tawanan, dan dibawa ke istananya. Nama mereka pun diubah: Daniel dinamai Beltsazar, Hananya dinamai Sadrakh, Misael dinamai Mesakh, dan Azarya dinamai Abednego. Nama Daniel yang berarti *“God is my judge”* menjadi Beltsazar yang berarti *“Nebuchadnezzar is my shield,”* merupakan salah satu cara Nebukadnezar untuk mengubah identitas Daniel. Ia ingin menekankan bahwa Nebukadnezar lah “allah” nya sekarang dan bukan Allah orang Israel.

Di sisi lain, sang raja memperlakukan mereka selayaknya keturunan Babel dengan menawarkan mereka makanan dan minuman seperti yang dihidangkan kepada raja, yang kemungkinan besar tidak sesuai dengan standar dari Israel (kosher). Tetapi Daniel beserta tiga orang lainnya (Hananya, Misael dan Azarya) berketetapan untuk tidak menajiskan dirinya dalam santapan tersebut dan meminta untuk diberikan sayur dan air selama 10 hari, karena mereka lebih memilih untuk taat pada firman Tuhan. Meskipun begitu, perawakan mereka lebih baik dibandingkan dengan para pemuda Babel yang memakan hidangan raja. Melihat kesetiaan mereka, Allah pun memberikan pengetahuan dan kepandaian tentang berbagai tulisan dan hikmat kepada masing-masing dari mereka, terutama Daniel, yang bisa mempunyai pengertian tentang berbagai penglihatan dan mimpi.

Dari sini kita bisa belajar, bagaimana Daniel (bersama tiga orang lainnya) mempunyai ketaatan yang begitu kuat kepada Allah dari usia yang bisa dibilang muda. Daniel bisa konsisten untuk tetap setia kepada Allah karena ia adalah seseorang yang rela dipimpin oleh Allah, yang menganggap Allah satu-satunya pengadil bagi hidupnya. Walau ia dikepung dan ditangkap pada masa mudanya, hingga diubah namanya, ia tetap melihat siapa pengadil dan *audience* sesungguhnya. Ketika kita taat, maka kita akan mendapat berkat dan penyertaan Tuhan. Pandangan dunia akan berkat dan penyertaan Tuhan berbeda dengan pandangan alkitab. Firman Tuhan menyatakan bahwa anugerah/berkat adalah keadilan, kesetiaan, kasih, kesabaran, dan kelemahlembutan, seperti yang tertulis pada surat Paulus (1 Tim 6:11). Daniel tidak ikut-ikutan menajiskan dirinya hanya untuk menyenangkan hati atau untuk beroleh “anugerah” dari raja Nebukadnezar karena ia tahu berkat/anugerah yang benar seperti apa.

Dari Daniel, kita boleh belajar dan merenungkan beberapa hal, terkhusus dengan pertanyaan: siapa sebenarnya *audience* di hidup kita? Dan siapa sebenarnya pengadil yang wajib kita puaskan? Karena di dunia modern ini, kita sering dituntut untuk bisa selalu *perform* dan menyenangkan orang banyak di sekitar kita melalui sosial media, prestasi, kekayaan dan lain lain, sehingga seringkali Allah tidak lagi menjadi pusat dari pikiran kita. Akibatnya, seringkali kita merasa gagal dan sulit untuk melihat anugerah, dan bertendensi untuk menyalahkan Allah. Ketika kita diberikan kesempatan untuk mengenal Allah lebih dalam, maka kita mengerti bahwa Allah sudah terlebih dahulu puas dengan manusia, sehingga ia menganugerahkan putra-Nya untuk mati di kayu salib, agar kita bisa melihat dan merasakan kemuliaan-Nya. Oleh sebab itu, ketaatan boleh menjadi bentuk syukur kita kepada Allah yang sudah menerima dan puas kepada kita yang begitu kecil ini, dibanding dengan ciptaan-Nya yang begitu besar dan luas.$notes$, $tldr$### **TL;DR PA Besar 07.02.2026 : Daniel I (Daniel 1:1-21)**

PA Besar: Steffen

Sekitar tahun 772 BC, Israel telah terbagi menjadi selatan dan utara, dimana di waktu yang sama, Israel bagian selatan dikepung oleh bangsa Babel, pimpinan raja Nebukadnezar. Selain mengepung Yehuda, ia juga menangkap pemuda-pemuda keturunan raja atau bangsawan Israel untuk dididik dan diubah identitasnya sesuai ajaran Babel.

Daniel, nabi Allah, termasuk dalam golongan tersebut. Ia bersama beberapa orang lainnya menjadi tawanan dan dibawa ke dalam kerajaan Babel. Mereka diharuskan untuk makan dan minum seperti yang dihidangkan pada raja, yang kemungkinan besar tidak sesuai dengan standar dari Israel (kosher). Tetapi Daniel bersama tiga orang lainnya (Hananya, Misael dan Azarya) menetapkan diri untuk tidak menajiskan dirinya dalam santapan tersebut. Melihat kesetiaan ini, Allah pun menyayangi mereka dan menganugerahkan tiap dari mereka kelebihan dan kepintaran.

Sifat Daniel yang mau untuk dipimpin Allah dan menjadikan Allah sebagai pengadil satu-satunya, menjadi poin penting untuk bisa kita renungkan. Karena di dunia modern ini, seringkali kita dituntut untuk bisa selalu memuaskan dan menyenangkan orang sekitar, melalui sosial media, harta, dll, sehingga seringkali yang menjadi pengadil atau *audience* kita adalah orang lain, bukan Tuhan.

Allah sudah puas dengan manusia, hingga Ia rela mengirimkan Putra-Nya agar kita manusia boleh melihat dan merasakan kemuliaan-Nya. Kita tidak lagi harus berlomba-lomba untuk memuaskan Allah. Oleh karena itu, apakah kita bisa dan mau untuk selalu taat kepada-Nya? Apakah Allah sudah menjadi pengadil dan *audience* satu-satunya di hidup kita? Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-02-14', 'church_service', $notes$### **14-02-2026: Seminar Lovetalk**

Seminar: Ps. Raguel Lewi

Tujuan Berpasangan dalam Kekristenan

Banyak orang mencari pasangan karena alasan kesepian, tekanan usia, atau tuntutan sosial. Namun Alkitab memberikan desain yang berbeda. Tujuan utama pernikahan adalah menggambarkan hubungan Kristus dan jemaat, serta menyatukan dua pribadi untuk memuliakan Tuhan bersama. Oleh karena itu, pacaran bukan tujuan akhir, melainkan masa pengenalan dan persiapan menuju pernikahan yang kudus.

Dua orang datang dari latar belakang keluarga, pola pikir, dan pengalaman hidup yang berbeda. Tidak ada seorang pun yang bisa membaca pikiran satu sama lain, sehingga komunikasi menjadi kunci. Pacaran yang memuliakan Tuhan berfokus pada pengenalan karakter, nilai hidup, dan keselarasan visi, bukan hanya pada perasaan yang menggebu-gebu.

Ada prinsip *"Fall in love when you are ready, not lonely."* Kita tidak membutuhkan pasangan untuk menjadi utuh, karena identitas dan keutuhan kita sudah ada di dalam Tuhan. Pasangan bukan hadir untuk *complete* kita seolah-olah ada bagian yang kurang, melainkan untuk *complement*—saling menguatkan dan mempertajam. Dua pribadi yang sama-sama utuh di dalam Kristus akan lebih siap membangun relasi yang sehat daripada dua pribadi yang saling bergantung karena kekosongan.

Dalam mencari pasangan, berlaku prinsip "ikan yang ditangkap bergantung pada umpan yang ditebar". Kita tidak menarik orang yang kita inginkan, melainkan kita menarik orang yang sesuai dengan diri kita (*we attract who we are*). Jika kita menginginkan pasangan yang mencintai firman Tuhan, maka kita sendiri harus menghidupi firman tersebut sebagai identitas kita. Oleh karena itu, masa lajang (*single*) adalah waktu krusial untuk membangun diri, mengenal identitas dalam Tuhan, dan berdamai dengan diri sendiri.

Alkitab menunjukkan gambaran karakter yang berkenan kepada Tuhan. Bagi laki-laki, teladan diambil dari Kejadian 1-2 yang mencakup *Leadership* (kemampuan memimpin diri sendiri dan visi hidupnya, sebagai dasar sebelum ia memimpin keluarganya), *Stewardship* (kemampuan mengelola dan mengembangkan apa yang dipercayakan Tuhan), dan *Relationship* (memiliki hubungan dengan Tuhan sebelum memiliki pasangan). Di sisi lain, gambaran bagi perempuan dapat dilihat dalam Kitab Amsal 31 tentang istri yang mulia, berharga lebih dari permata, rajin, bijaksana, takut akan Tuhan, dan menjadi berkat bagi keluarganya. Karakter ini diwujudnyatakan dalam perannya sebagai penolong yang sepadan (*ezer*) yang memberikan penghormatan kepada suami, sebagaimana laki-laki juga diperintahkan untuk mengasihi (Efesus 5). Peran ini bukan soal siapa lebih tinggi, tetapi tentang fungsi yang saling melengkapi sesuai desain Tuhan.

Dalam masa pacaran, batasan juga menjadi hal yang tidak bisa diabaikan. Seks dan intimasi diibaratkan seperti api: sangat indah dan menghangatkan di dalam pernikahan, tetapi dapat membakar dan melukai jika di luar tempatnya. Karena itu, diperlukan penguasaan diri, komitmen pada kekudusan, dan kesadaran bahwa tubuh dan hati kita berharga di hadapan Tuhan.

Akhirnya, setiap musim hidup memiliki tujuannya sendiri. Jika saat ini masih sendiri, jangan melihatnya sebagai masa tertinggal. Gunakan waktu untuk membangun diri dan memperdalam relasi dengan Tuhan. Lebih baik mengakhiri hubungan yang tidak memuliakan Tuhan daripada memaksakan diri masuk ke dalam pernikahan yang salah dan berujung pada perceraian. Fokuslah mencari Tuhan terlebih dahulu. Ketika dua orang sama-sama mencari Tuhan, Tuhanlah yang akan mempertemukan dan mempersatukan mereka dalam waktu dan cara-Nya.$notes$, $tldr$### **TL;DR Seminar 14.02.2026 : Lovetalk**

Seminar: Ps. Raguel Lewi

Tujuan berpasangan menurut Alkitab bukan untuk mengusir rasa sepi, melainkan untuk memuliakan Tuhan. Prinsip penting yang perlu diingat adalah *"Fall in love when you are ready, not lonely."* Pasangan hadir bukan untuk membuat kita utuh (*complete*)—karena kita sudah utuh dalam Kristus—melainkan untuk saling menguatkan dan menambah (*complement*).

Dalam mencari pasangan, ada pepatah *"we attract who we are."* Kualitas diri kitalah yang menentukan siapa yang tertarik kepada kita. Oleh karena itu, masa lajang adalah waktu terbaik untuk membangun diri. Laki-laki diajak memiliki kepemimpinan (L*eadership*), kemampuan mengelola dan mengembangkan (*Stewardship*) dan hubungan erat dengan Tuhan (*Relationship*). Sementara itu, perempuan diajak menjadi penolong yang sepadan dan memiliki karakter seperti yang digambarkan dalam Amsal 31.

Masa pacaran adalah momen pengenalan karakter dengan batasan yang kudus, ibarat api yang harus dijaga pada tempatnya agar tidak membakar. Ingatlah, lebih baik mengakhiri hubungan yang salah saat ini daripada memaksakan pernikahan yang berujung perceraian. Jika saat ini masih sendiri, jangan melihatnya sebagai masa tertinggal. Gunakan waktu ini untuk membangun diri dan memperdalam relasi dengan Tuhan. Fokuslah mencari Tuhan, maka Ia yang akan mempertemukan pada waktu-Nya. Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-02-21', 'bible_study', $notes$### **21-02-2026: Fireproof Faith (Daniel 3:1-30)**

PA Besar: Ido

Ketika Yerusalem dikepung oleh Babel banyak kaum bangsawan muda, termasuk Daniel, Sadrakh, Mesakh, dan Abednego dibuang ke Babel. Strategi Babel saat itu bukan sekadar penaklukan fisik, melainkan sebuah upaya sistematis untuk menghapus identitas bangsa jajahan melalui indoktrinasi budaya dan pendidikan. Para pemuda ini dididik secara khusus agar pola pikir mereka selaras dengan propaganda Babel, sehingga mereka dapat berfungsi sebagai aset politik yang telah kehilangan jati diri asli mereka. Namun, berkat hikmat Tuhan dalam menuntun Daniel mengartikan mimpi raja Nebukadnezar, mereka mendapat jabatan dalam pemerintahan Babel.

Memasuki peristiwa di Daniel pasal 3, Raja Nebukadnezar mendirikan sebuah patung emas raksasa yang berfungsi sebagai instrumen politik, agama, sekaligus pengukuhan ego personal. Patung tersebut bertujuan untuk mempersatukan rakyat Babel yang multikultural di bawah satu simbol nasionalisme yang wajib disembah. Bagi para penafsir, patung ini merepresentasikan ambisi Nebukadnezar untuk mengabadikan kekuasaannya. Di tengah tekanan tersebut, orang-orang Kasdim melaporkan ketidakpatuhan Sadrakh, Mesakh, dan Abednego yang menolak untuk menyembah patung emas tersebut, sebuah tindakan yang dianggap sebagai pembangkangan terhadap negara.

Keteguhan hati ketiga pemuda ini saat menghadapi vonis perapian yang menyala-nyala menunjukkan kualitas iman yang melampaui kepentingan duniawi. Mereka tidak melakukan pemberontakan fisik karena mereka memahami bahwa kedaulatan Allah jauh lebih tinggi daripada jabatan atau keamanan yang ditawarkan oleh negara Babel. Fokus hidup mereka bukan sekadar membuktikan kesalahan Raja, melainkan menjaga pengabdian murni kepada Allah. Bagi mereka, relasi dengan Tuhan adalah nilai yang tidak dapat ditukar dengan *bargaining chip* apapun, bahkan nyawa sekalipun. Mereka percaya sepenuhnya pada kedaulatan Allah, baik Tuhan memilih untuk menyelamatkan mereka secara fisik maupun tidak.

Puncak dari peristiwa ini terjadi di dalam perapian, dimana Allah menyatakan kehadiran-Nya secara nyata di tengah penderitaan hamba-Nya. Sosok keempat yang muncul di dalam api membuktikan bahwa Tuhan tidak pernah meninggalkan mereka yang setia. Melalui ujian api tersebut, kedaulatan Allah akhirnya diakui oleh banyak orang, termasuk oleh Raja Nebukadnezar sendiri. Peristiwa ini mengajarkan bahwa melalui penderitaan yang dihadapi dengan iman, dunia dapat melihat kemuliaan dan kedaulatan Allah yang melampaui segala kekuasaan manusia.$notes$, $tldr$### **TL;DR PA Besar 21.02.2026 : Fireproof Faith (Daniel 3:1-30)**

PA Besar : Ido

Kisah Daniel, Sadrakh, Mesakh dan Abednego bermula saat mereka diasingkan ke Babel, dimana pemerintah Babel berupaya menyelaraskan pikiran mereka dengan propaganda Babel dan kultur Babel. Namun Tuhan justru memberikan hikmat karena ketaatan mereka pada firman Tuhan sehingga mereka meraih jabatan di pemerintahan. Konflik memuncak ketika Raja Nebukadnezar mendirikan patung emas raksasa sebagai instrumen politik dan agama untuk mempersatukan rakyatnya yang multikultural. Sadrakh, Mesakh dan Abednego menolak menyembah patung tersebut karena bagi mereka kedaulatan Allah jauh lebih berharga daripada jabatan atau nyawa.

Keteguhan iman ketiga pemuda ini bukan didasari oleh semangat pemberontakan, melainkan oleh pengabdian murni kepada Allah yang kedaulatan-Nya melampaui segala kekuasaan duniawi. Mereka menolak menukar relasi spiritual mereka dengan keamanan jabatan, bahkan saat menghadapi ancaman perapian yang menyala-nyala. Di tengah siksaan api itulah, kehadiran Allah dinyatakan secara nyata melalui sosok keempat yang menemani mereka, membuktikan bahwa Tuhan tidak pernah meninggalkan hamba-Nya. Melalui penderitaan dan kesetiaan inilah, kedaulatan Allah akhirnya diakui oleh bangsa-bangsa lain dan kemuliaan-Nya dinyatakan kepada dunia.

Lalu bagaimana dengan kita? Apakah kita punya iman yang tahan uji dalam perapian apapun? Apakah kita mau memiliki iman seperti Sadrakh, Mesakh dan Abednego yang percaya kedaulatan Allah? Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-02-28', 'bible_study', $notes$### **28-02-2026: Doa Daniel (Daniel 9:1-19)**

PA Besar: Toni

Sesuai peringatan dan janji Tuhan yang disampaikan lewat nabi-nabiNya, bangsa Israel mengalami masa pembuangan/pengasingan selama 70 tahun (dari 605 SM sampai 535 SM). Daniel hidup di tengah-tengah masa itu. Dari muda ia sudah menjadi bagian dari negara Babel, dan di masa tuanya ia pun menduduki posisi yang tinggi di kerajaan Media-Persia. Akan tetapi, bahkan di negara-negara asing itu ia tetap setia untuk menaati Tuhan dan memelihara hubungannya dengan Dia. Kehidupan doanya bisa menjadi teladan bagi kita. Apa yang “berbeda” dari doa Daniel? Sebelumnya, kita bisa mengamati bahwa Daniel bukanlah orang yang hanya pasif selagi menunggu tindakan/penggenapan janji Tuhan. Sesudah membaca tentang janji penyelamatan Tuhan atas bangsa Israel (ay. 2-3), Daniel pun segera berdoa kepada Tuhan, secara aktif memohon agar Dia mengampuni Israel dan menggenapi janjiNya. Ini menunjukkan bahwa Daniel menjunjung tinggi janji Tuhan; ia menganggapnya serius dan percaya bahwa itu akan digenapi!

Kemudian kita juga bisa belajar dari cara Daniel berdoa, tentang hal-hal yang ada dalam doanya. Pertama-tama Daniel memanjatkan puji-pujian kepada Tuhan Allah, menyebutkan kebesaran, kedahsyatan juga kedaulatanNya. Karena pengenalannya akan Allah yang dibangun selama ini, Daniel bisa punya iman dan harapan dalam Dia, bahwa Ia berdaulat atas segala situasi dan akan menyatakan kebaikanNya. Selain itu Daniel juga merendahkan dirinya di hadapan Tuhan. Menghadapi Tuhan yang Mahakudus, Daniel mewakili Israel untuk mengakui dosa-dosa mereka kepadaNya. Tetapi ia juga tetap memegang teguh kasih Tuhan, bahwa Tuhan Maha Pengasih dan Pengampun. Imannya dalam kasih Tuhan ini turut berperan untuk memurnikan pertobatan Daniel. Karena ia sudah percaya akan kasih Tuhan, maka pertobatannya tidak dimotivasi oleh rasa takut dan kepentingan diri sendiri, untuk sekedar luput dari konsekuensi dosa. Daniel juga tidak lupa untuk bersyukur atas segala perbuatan baik dan hebat yang telah Tuhan lakukan bagi Israel (ay. 15), sambil menyampaikan juga permohonannya, yaitu agar Tuhan kembali membebaskan dan memulihkan Israel. Motivasinya hanyalah supaya nama Tuhan dimuliakan, di Israel dan juga bangsa-bangsa lain!

Membaca perikop ini, kita bisa melihat pertama-tama pentingnya membangun hubungan dengan Tuhan lewat doa dan perenungan Firman Tuhan. Lewat hal inilah kita bisa mengenal Tuhan kita lebih dalam! Kita bisa lebih mengenal kebaikan dan kedaulatanNya, yang menguatkan iman dan harapan kita dalam Dia. Kita juga diajar untuk memiliki sikap hati yang benar dalam pertobatan. Jadi, bagaimana dengan kehidupan doa kita? Apakah cara berdoa kita sudah benar? Apakah pertobatan kita juga berdasarkan motivasi yang murni? Bagi mereka yang sungguh-sungguh bertobat, janji pengampunan Tuhan sudah tersedia (1 Yoh. 1:9).$notes$, $tldr$### **TL;DR PA Besar 28.02.2026 : Doa Daniel (Daniel 9:1-19)**

PA Besar : Toni

Bangsa Israel masih berada dalam masa pembuangan, menunggu penggenapan janji Tuhan tentang pembebasan mereka. Daniel, yang sekarang sudah tua, tetap teguh memercayai janji Tuhan ini, tapi ia tidak diam saja! Ia berdoa kepada Tuhan dan berpuasa, menyampaikan pertobatannya dan juga permohonannya.

Kita bisa belajar dari doa Daniel tentang sikap-sikap hati -dalam berdoa- yang berkenan kepada Tuhan. Daniel memulai dengan puji-pujian, memahsyurkan nama Tuhan yang sudah ia kenal seumur hidupnya, melalui doa dan perenungan FirmanNya. Ia juga merendahkan diri di hadapan Tuhan, memohon pengampunan atas dosa-dosa yang ia dan bangsa Israel lakukan. Hal ini dapat ia lakukan dengan sepenuh hati karena Daniel percaya penuh akan karya pengampunan dan kasih Tuhan! Selain itu Daniel juga tidak lupa akan kebaikan Tuhan kepada bangsa Israel yang sudah Ia lakukan sejak dahulu. Ia bersyukur, dan memohon agar Tuhan melakukannya lagi, bukan demi Israel, tapi demi kemuliaan namaNya!

Bagaimana hubungan kita dengan Tuhan? Apakah kita sudah berdoa dengan cara yang benar? Apakah pertobatan kita juga berdasarkan motivasi yang murni? Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-03-07', 'church_service', $notes$### **07-03-2026: Ketika Diam Bukan Pilihan (Ester 4)**

Ibadah: Pdt. Titus

Suatu konflik yang terjadi dalam kehidupan persekutuan dapat Tuhan pakai untuk menajamkan karakter, kepekaan, perhatian, dan kepedulian kita terhadap sesama. Karena itu, dalam banyak situasi, diam bukanlah pilihan yang netral. Terlebih sebagai orang percaya, kita sering kali tahu ada hal yang tidak benar, ada kompromi, ada kehidupan yang mulai bergerak ke arah abu-abu, tetapi kita memilih untuk tidak berkata apa-apa. Padahal, netralitas yang membiarkan kesalahan tetap berlangsung bukanlah netralitas yang sejati.

Tanpa sadar, kita juga dibentuk oleh budaya di sekitar kita untuk melihat iman hanya sebagai urusan pribadi. Selama sesuatu tidak langsung berhubungan dengan diri kita, kita merasa tidak perlu terlibat. Pola pikir seperti ini bisa terbawa ke dalam kehidupan persekutuan: kita tahu ada teman yang sedang bergumul, tahu ada kompromi yang sedang terjadi, tetapi kita memilih diam demi menjaga kenyamanan. Ester 4 menolong kita melihat bahwa ada saat-saat ketika diam bukan lagi bentuk kebijaksanaan, melainkan bentuk ketidaktaatan.

1. Tuhan sering bekerja dengan cara yang tidak terduga

Ester tidak pernah membayangkan bahwa hidupnya akan sampai pada titik itu. Ia hanyalah seorang perempuan Yahudi, yatim piatu, yang hidup di negeri asing. Namun Tuhan menempatkannya menjadi ratu pada waktu yang sangat penting. Menariknya, kitab Ester tidak pernah menyebut nama Tuhan secara eksplisit, tetapi justru di sanalah kita belajar bahwa tangan Tuhan tetap bekerja, bahkan melalui rangkaian peristiwa yang tampak biasa.

Sering kali kita berharap Tuhan menunjukkan kehendak-Nya dengan sangat jelas dan spektakuler. Kita ingin arahan yang rinci, pasti, dan langsung. Namun Tuhan sering bekerja melalui hal-hal yang sederhana: studi, pekerjaan, relasi, konflik, pertemuan, bahkan pergumulan sehari-hari. Karena itu, hidup kita bukan sekadar rangkaian peristiwa biasa. Tuhan dapat memakai konteks hidup kita saat ini sebagai bagian dari rencana-Nya. Posisi yang tampak kecil sekalipun bisa menjadi panggilan yang besar ketika berada di tangan Tuhan.

2. Panggilan Tuhan lebih besar dari ketakutan kita

Ketakutan Ester sangat nyata. Ia tahu bahwa menghadap raja tanpa dipanggil berarti mempertaruhkan nyawanya. Jadi persoalannya bukan karena ia tidak beriman, tetapi karena ia sadar bahwa ketaatan memiliki harga yang mahal. Hal yang sama juga sering terjadi dalam hidup kita. Kita takut ditolak, takut kehilangan relasi, takut dianggap fanatik, takut gagal, takut salah mengambil keputusan, takut berbicara kebenaran, atau takut berdiri teguh sebagai orang Kristen di kampus, tempat kerja, dan lingkungan sosial.

Sering kali kita memilih diam bukan karena bijaksana, tetapi karena kita lebih mencintai rasa aman daripada ketaatan. Namun perkataan Mordekhai dalam Ester 4:14 menjadi teguran yang kuat: *“Siapa tahu, mungkin justru untuk saat yang seperti ini engkau beroleh kedudukan…”* Ini mengingatkan bahwa Tuhan dapat menempatkan kita pada posisi tertentu untuk tujuan tertentu. Jika kita tidak mau taat, Tuhan tetap dapat memakai orang lain. Tetapi betapa tragis jika kita melewatkan kesempatan untuk ambil bagian dalam pekerjaan Tuhan hanya karena kita terlalu sibuk melindungi diri sendiri.

3. Ketaatan yang berani lahir dari komunitas dan identitas dalam Tuhan

Keberanian Ester bukanlah keberanian yang muncul dari dirinya sendiri. Sebelum ia melangkah, ia meminta seluruh orang Yahudi untuk berpuasa dan berdoa. Ia tidak maju sendirian, melainkan bersama umat Tuhan. Dari sini kita belajar bahwa keberanian rohani tidak tumbuh dalam ruang yang kosong, tetapi dibentuk melalui doa, firman, dan komunitas yang saling menopang.

Selain itu, ketaatan yang berani juga lahir dari identitas kita dalam anugerah Allah. Dalam Kristus, kita tidak lagi hidup untuk menyelamatkan diri sendiri. Kristus telah lebih dahulu taat sampai mati di kayu salib bagi kita. Karena itu, ketika Tuhan memanggil kita untuk taat, itu bukan untuk membayar keselamatan, melainkan karena kita sudah ditebus dan hidup kita sekarang adalah milik-Nya. Ketaatan bukanlah usaha untuk terlihat rohani, tetapi buah dari anugerah dan bukti bahwa Kristus hidup di dalam kita.$notes$, $tldr$### **TL;DR Ibadah 07.03.2026 : Ketika Diam Bukan Pilihan (Ester 4)**

Ibadah: Pdt. Titus

Melalui Ester 4, kita belajar bahwa Tuhan sering bekerja dengan cara yang tidak terduga. Ester tidak pernah membayangkan dirinya menjadi ratu, tetapi Tuhan menempatkannya di posisi itu untuk menjalankan rencanaNya untuk menyelamatkan bangsa Yahudi dari kejahatan genosida yang direncanakan Haman. Sehingga sesuatu yang tampaknya seperti kebetulan merupakan bagian dari rencana Tuhan yang besar.

Setelah disadarkan Mordekhai bahwa kedudukannya dapat menyelamatkan bangsa Yahudi (4:14), Ester bertekad untuk menemui Raja Ahasyweros. Menghadap raja tanpa diundang dapat berakibat hukuman mati. Namun, walaupun ia takut karena nyawa taruhannya, Ester tetap mau melakukannya (4:16). Disini Ester mengajarkan kita bahwa panggilan Tuhan lebih besar daripada ketakutan kita.

Hidup dalam persekutuan tidak lepas dari konflik. Namun Tuhan dapat memakai konflik untuk membentuk karakter, kepekaan, perhatian, dan kepedulian kita. Kadang diam justru menjadi kompromi saat kita tahu ada yang tidak benar tetapi memilih netral demi kenyamanan; oleh karena itu, diam tidak selalu berarti bijak. Memang butuh keberanian untuk menyatakan kebenaran, namun keberanian itu bisa kita dapatkan melalui doa, komunitas, dan penyerahan diri kepada Tuhan.

Melalui bacaan ini kita dapat merefleksikan: Apakah aku diam karena bijak, atau karena takut taat? Apakah ada area hidup yang sedang Tuhan minta untuk aku respons? Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-03-14', 'church_service', $notes$### **14-03-2026: Kebetulan Atau Kuasa Allah (Ester 8)**

Ibadah: Ko Willy

Kalau kita melihat dunia sekitar kita, banyak hal yang sepertinya terjadi secara kebetulan. Khususnya penemuan-penemuan ilmiah yang terjadi (misal sinar X, Penicillin), yang bermanfaat bagi manusia. Apakah semua hal ini hanya kebetulan semata? Secara personal kita juga mungkin telah mengalami kejadian-kejadian dalam hidup yang tampaknya terlalu ajaib dan *unlikely,* tapi tetap saja terjadi. Apakah mungkin ada tangan Tuhan yang memimpin dan mengarahkan di balik semua ini?

Kehidupan Ester dan orang-orang sekitarnya juga tampaknya dipenuhi kebetulan. Sepanjang hidupnya, ada kejadian demi kejadian yang pada akhirnya berefek secara kumulatif: Ester jadi bisa menyelamatkan orang Israel dari bahaya kebinasaan akibat rencana jahat Haman (pasal 7-8). Semua ini tidak akan terlaksana jika rangkaian peristiwa “kebetulan” ini tidak terjadi: Ester dipilih jadi ratu, Mordekhai menyelamatkan nyawa raja, Ester mendapat pengampunan dari raja (pasal 5:2), dan lain-lain. Memang, nama Tuhan tidak disebutkan di kitab Ester, tapi bukankah pekerjaan tanganNya terlihat dari awal sampai akhir?

Lalu bagaimana kita dapat mengenali pekerjaan tangan Tuhan? Pertama-tama, saat Tuhan bekerja, di situ ada keadilan. Tidak seperti manusia yang lebih mementingkan keuntungan sendiri daripada keadilan, Tuhan adil dalam setiap jalanNya. Di kisah Ester ada suatu ketidakadilan: karena tindakan satu orang (Mordekhai, pasal 3:2-4), satu Israel jadi kena hukuman. Tindakan Mordekhai bisa saja berasal dari dendam pribadi terhadap Haman, karena ia berasal dari keturunan Benyamin dan Haman dari Raja Agag (lihat 1 Sam. 15:8,33). Lagipula, tidak disebutkan di kitab Taurat sebuah larangan untuk sujud kepada raja dan para petingginya. Bagaimanapun, saat Tuhan bertindak, keadilan pun diwujudkan bagi Israel (pasal 8)! Selain itu, dalam tindakan Tuhan kasih juga ditunjukkan. Ester, yang secara manusiawi tidak akan memilih untuk membahayakan nyawanya demi orang lain (pasal 4), melalui pekerjaan Tuhan akhirnya memilih untuk mengorbankan dirinya. Kita juga bisa melihat pemeliharaan Tuhan dalam intervensi-intervensiNya. Bangsa Israel, yang tadinya akan ditimpa malapetaka, Tuhan selamatkan dan pelihara! Pada akhirnya mereka bersukacita, dan bangsa-bangsa lain juga ingin jadi bagian dari mereka (pasal 8:17).

Apakah kita bisa mengenali pekerjaan-pekerjaan Tuhan dalam hidup kita? Ialah yang sudah menegakkan keadilan dalam hukumanNya terhadap dosa (Rom. 3:23-26), yang juga menunjukkan kasihNya kepada kita -lewat karya keselamatan Kristus- saat kita masih berdosa. Dalam setiap langkah hidup kita, susah atau senang, Ia juga yang akan memelihara kita sebagai anak-anakNya! Ketika menyadari bahwa hidup kita ada dalam kuasa Allah, kita akan menyadari bahwa tidak ada sesuatu yang merupakan kebetulan dalam hidup kita karena itu merupakan bentuk penyertaan dan bimbingan Tuhan. KeinginanNya adalah supaya kita terus mengandalkan dan mempercayai Dia, apapun kesulitan kita. Pada akhirnya, Tuhan akan bertindak, menggenapi rencanaNya, dan namaNya akan dimuliakan!$notes$, $tldr$### **TL;DR Ibadah 14.03.2026 : Kebetulan Atau Kuasa Allah (Ester 8)**

Ibadah : Ko Willy

Pernahkah kita mengalami hal-hal yang begitu menakjubkan, yang tampaknya terjadi secara “kebetulan”? Mungkin kita telah mengalaminya berkali-kali. Apakah itu benar-benar kebetulan, atau hasil dari pekerjaan tangan Tuhan?

Ester juga mengalami banyak hal yang tampaknya kebetulan semata: ia terpilih jadi ratu, pamannya Mordekhai terhindar dari malapetaka, nyawanya diselamatkan dari kebinasaan (pasal 5:2), dll. Ini menunjukkan adanya pekerjaan Tuhan! Bagaimana kita tahu akan hal itu? Saat Tuhan bekerja, akan ada keadilan, kasih dan pemeliharaan. Tuhan bekerja dalam hati Ester, sehingga Ester bisa bertindak dalam kasih dan pengorbanan untuk bangsanya. Ia juga bekerja untuk memelihara dan menyelamatkan Israel dari kebinasaan dan ketidakadilan (pasal 3-8)!

Kita juga bisa melihat jejak tangan Tuhan dalam hidup kita. Bukankah Ia sudah menunjukkan keadilan dan kasihNya lewat karya keselamatan Yesus Kristus? Lalu, bukankah Tuhan juga berjanji akan memelihara kita, anak-anakNya? Seluruh hidup kita ada dalam kuasa, rencana dan penyertaanNya, sehingga tidak ada sesuatu yang hanya kebetulan! Mari kita belajar percaya dan mengandalkan Dia, dalam situasi apapun! Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-03-21', 'bible_study', $notes$### **21-03-2026: Ezra I (Ezra 9 - 10)**

PA Besar: Billy

Ezra, yang namanya berarti “Tuhan menolong”, adalah seorang ahli Taurat yang dipakai Tuhan untuk memulihkan kehidupan rohani bangsa Israel setelah masa pembuangan di Babilonia. Jika Zerubabel berfokus pada pembangunan bait Allah dan Nehemia pada pembangunan tembok Yerusalem, maka Ezra dipanggil untuk membangun kembali identitas spiritual bangsa Israel melalui ketaatan pada hukum Taurat.

1. Kasus Kawin Silang dan Bahaya Sinkretisme

Setibanya di Yerusalem, Ezra mendapati bahwa bangsa Israel, termasuk para pemimpin, telah melakukan perkawinan campur dengan bangsa-bangsa di sekitar mereka. Permasalahan ini bukan sekadar persoalan sosial atau budaya, melainkan persoalan iman. Perkawinan campur tesebut membuka jalan bagi sinkretisme, yaitu mencampurkan penyembahan, bukan hanya kepada satu satunya Tuhan, Yahweh, tetapi juga kepada allah lain. Hal ini secara langsung melanggar kekudusan yang Tuhan tuntut dari umat-Nya sebagai bangsa pilihan.

1. Respons Ezra dan Doa Penyesalan

Menanggapi hal ini, Ezra menunjukan dukacita yang mendalam sebagai respons atas dosa bangsa Israel. Ia mengoyakkan pakaiannya, mencambut rambutnya, dan duduk dengan tertegun. Dalam pasal 9, ia memanjatkan doa pangakuan dosa yang bukan hanya mewakili dirinya, tetapi seluruh bangsa. Ia mengakui bahwa dosa ini adalah kelanjutan dari pemberontakan yang telah dilakukan sejak generasi sebelumnya. Ezra menyadari bahwa Tuhan tidak meninggalkan Israel, melainkan memberi mereka kelegaan dan kesempatan kembali serta membangun kembali bait Allah. Namun, anugerah itu dibalas dengan ketidaksetiaan.

Dari doa Ezra, kita melihat bahwa pemulihan selalu diawali dengan kesadaran akan dosa dan kerendahan hati di hadapan Tuhan.

1. Solusi yang Berat: Pengusiran

Pasal 10 mencatat respons umat terhadap doa dan sikap Ezra. Bangsa Israel berkumpul dan menangis dengan sangat, menunjukkan adanya pertobatan kolektif. Dalam situasi tersebut, Sekhanya mengusulkan suatu tindakan tegas, yaitu memisahkan diri dari istri-istri yang berasal dari bangsa asing. Keputusan ini bukanlah keputusan yang ringan, bahkan membawa konsekuensi yang sangat berat secara sosial dan emosional. Namun, tindakan tersebut diambil sebagai bentuk keseriusan dalam memulihkan kembali kekudusan dan ketaatan kepada Tuhan.

Langkah ini menunjukan bahwa pertobatan sejati tidak hanya berhenti pada penyesalan, tetapi diwujudkan dalam tindakan nyata, sekalipun sulit dan menyakitkan.

1. Konsekuensi dosa

Dosa tidak hanya bersifat pribadi, tetapi dapat berdampak luas dan merusak komunitas umat Tuhan. Sering kali dosa hadir dalam bentuk kompromi yang tampak wajar, namun perlahan menjauhkan kita dari Tuhan.

Karena itu, mari memeriksa diri dengan jujur: adakah “allah lain” dalam hidup kita? Seperti Ezra, kita diajak untuk meneladani cara Ezra berdoa memohon pengampunan dan berani mengambil langkah tegas untuk menyingkirkan dosa dari hidup kita. Sebab pemulihan sejati hanya terjadi ketika kita kembali hidup dalam kekudusan dan ketaatan.

Pada akhirnya, kita bersyukur karena dalam Perjanjian Baru, pengampunan dosa digenapi melalui pengorbanan Yesus Kristus. Di dalam Dia, kita tidak hanya diampuni, tetapi juga dimampukan untuk hidup sebagai umat yang kudus di hadapan Tuhan.$notes$, $tldr$### **TL;DR PA Besar 21.03.2026 : Ezra I (Ezra 9 - 10)**

PA Besar: Billy

Ezra dipanggil Tuhan untuk memulihkan identitas rohani bangsa Israel setelah masa pembuangan. Namun setibanya di Yerusalem, ia mendapati umat Tuhan telah melakukan perkawinan campur. Hal ini sangat berbahaya karena membuka jalan bagi sinkretisme, yaitu mencampurkan penyembahan kepada Tuhan dengan allah lain.

Meresponi dosa tersebut, Ezra menunjukkan kesedihan yang mendalam dan memanjatkan doa pengakuan dosa yang mewakili seluruh umat Israel. Sebagai wujud pertobatan, bangsa Israel akhirnya mengambil keputusan yang sangat berat, yaitu memisahkan diri dari istri-istri yang berasal dari bangsa asing demi memulihkan kekudusan di hadapan Tuhan. Keputusan ini menunjukan bahwa dosa memiliki konsekuensi nyata dan sering kali menyakitkan.

Kita diingatkan bahwa dosa dan kompromi kecil dapat merusak hubungan kita dengan Tuhan, bahkan berdampak lebih luas dari yang kita sadari. Karena itu, kita diajak untuk meneladani sikap Ezra: datang kepada Tuhan dengan kerendahan hati, memohon pengampunan, dan berani mengambil langkah tegas untuk menyingkirkan dosa dari hidup kita.

Mari memeriksa diri dengan jujur: adakah “allah lain” dalam hidup kita? Pemulihan sejati berawal dari kerendahan hati untuk bertobat. Kita pun bersyukur karena pengampunan dosa yang sempurna telah disediakan melalui Yesus Kristus. Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-03-28', 'church_service', $notes$### **28-03-2026: Kasih yang tidak berhenti di hati (Nehemia 1:1-11)**

Ibadah: Pdt.John

Di era informasi digital saat ini, kita terus-menerus mendengar berita menyedihkan dari media sosial maupun kanal berita lainnya. Namun ironisnya, di tengah melimpahnya informasi, banyak orang justru mengalami "kelelahan untuk peduli." Kita sering kali terjebak dalam kondisi di mana kita mengetahui banyak penderitaan, namun merasa tidak berdaya atau bahkan kehilangan belas kasih untuk melakukan sesuatu.

Berdasarkan teladan Nehemia, kasih yang sejati selalu dimulai dari kepedulian yang mendalam. Ketika Nehemia menerima kabar buruk dari Hanani mengenai kondisi Yerusalem yang hancur dan umat yang terpuruk, ia sebenarnya sedang berada dalam posisi yang sangat nyaman. Sebagai juru minuman raja di istana, Nehemia memiliki keamanan finansial, pekerjaan yang stabil, dan hidup yang jauh dari kesulitan. Namun, kenyamanan itu tidak menumpulkan hatinya. Respon Nehemia sangat emosional; ia duduk, menangis, berkabung, dan berpuasa selama berhari-hari. Ini mengajarkan kita bahwa kasih tidak langsung dimulai dengan gerakan fisik, melainkan berawal dari hati yang mau merasa dan peduli (Ayat 1-4).

Masalah utama kita saat ini bukanlah kurangnya informasi, melainkan kurangnya kedalaman empati terhadap lingkungan sekitar. Kita sering kali terlalu sibuk dengan dunia sendiri—terutama bagi mahasiswa yang terjebak dalam rutinitas “*klausur season”* atau tekanan hidup pribadi—sehingga kita abai terhadap teman atau sesama yang sedang berjuang *(struggle)*. Tanpa kepedulian, kita hanya akan hidup dalam gelembung egoisme kita sendiri.

Lebih jauh lagi, kasih yang sejati selalu membawa kita kembali kepada Tuhan (Ayat 5-7). Alih-alih langsung bertindak dengan gegabah atau sibuk menyalahkan sistem dan orang lain sebagaimana tren masyarakat saat ini, Nehemia justru tersungkur di hadapan Tuhan. Ia mengakui kedaulatan Tuhan serta mengakui dosa-dosanya dan dosa bangsanya. Tanpa melibatkan Tuhan, tindakan menolong kita mungkin hanya menjadi reaksi emosional yang dangkal atau bahkan salah arah. Kasih yang sejati mengakui bahwa kita membutuhkan penyertaan Tuhan dalam setiap langkah kepedulian kita.

Pada akhirnya, kasih yang sejati akan menghasilkan tindakan yang berani dan nyata (Ayat 8-11). Setelah berdoa dan bergumul di hadapan Tuhan, Nehemia tidak berdiam diri. Sebagai juru minuman, ia berani mengambil risiko besar dengan menghadap raja untuk memohon izin membangun kembali tembok Yerusalem. Ia rela mengambil risiko bakal mati demi menaati firman Tuhan.$notes$, $tldr$### **TL;DR Ibadah 28.03.2026: Kasih yang tidak berhenti di hati (Nehemia 1:1-11)**

Ibadah: Pdt. John

Dari Nehemia kita dapat belajar bahwa kasih sejati adalah sebuah perjalanan yang dimulai dari hati, dibawa ke hadapan Tuhan, dan diwujudkan melalui tindakan. Di tengah zaman yang penuh informasi namun kering akan empati, kita sering kali terjebak dalam rutinitas dan kenyamanan pribadi sehingga kehilangan kepekaan terhadap penderitaan di sekitar kita.

Nehemia mengajarkan bahwa kasih tidak bergantung pada kondisi pribadi, yakni ekonomi, status, relasi, dan lain lain; karena meski ia hidup mapan di istana, ia turut berkabung atas kondisi bangsanya. Namun, kasih Nehemia tidak berhenti pada air mata saja. Ia membawa beban tersebut kepada Tuhan melalui doa dan pengakuan dosa, menyadari bahwa tanpa campur tangan Allah, segala bentuk pertolongan manusia hanyalah sebuah reaksi yang dangkal. Pada akhirnya, kasih yang melibatkan Tuhan inilah yang memberi Nehemia keberanian untuk keluar dari zona nyamannya dan mengambil risiko nyata demi membangun kembali tembok Yerusalem yang telah runtuh.

Apakah kita sudah memiliki kasih yang dibuahkan melalui tindakan nyata? Ataukah kasih kita telah terhenti hanya sebagai wacana? Mari kita jadikan renungan ini sebagai momentum untuk mengevaluasi hati kita: apakah kasih kita hanya sebatas perasaan, ataukah ia cukup kuat untuk membawa kita melangkah keluar dari zona nyaman demi menolong sesama? Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-04-11', 'bible_study', $notes$### **11-04-2026: Iman yang membawa perubahan (Nehemia 13:1-31)**

PA Besar: Aldi

Nehemia adalah sosok teladan kasih, yang rela meninggalkan posisinya sebagai juru minum di Kerajaan Media-Persia karena berempati dengan keadaan Israel yang tengah hancur. Ia pun berniat untuk kembali ke Yerusalem untuk membangun kembali tembok-tembok yang runtuh. Namun ditengah-tengah itu Nehemia menghadapi beberapa hambatan juga ancaman, dan dalam kisah ini kita diajak untuk melihat bagaimana orang yang cinta Tuhan menghadapinya.

1. Membawa Perbedaan

Nehemia datang ke Yerusalem dengan membawa hati yang penuh empati dan menginginkan adanya perubahan. Ia menyelidiki dahulu apa yang rusak, dan mengajak orang-orang Yahudi untuk bersama-sama membangun kembali tembok Yerusalem. Ditengah-tengah niat baiknya, ia dihadapkan dengan Sanbalat (orang Horon), Tobia (orang Amon) dan Gesyem (orang Arab) yang mengolok-ngolok pekerjaan Nehemia. Tetapi Nehemia pun tidak menghiraukan mereka dan tetap taat serta beriman pada Tuhan (2:20).

Hal ini membuktikan bahwa orang-orang yang cinta Tuhan itu berbeda, dimana ketika keadaan membuat nyaman, Nehemia memilih menjadi berbeda  dengan cara turun langsung dan meninggalkan zona nyamannya! Di tengah-tengah hambatan yang datang, ia tetap mengandalkan Tuhan dan melihat ujian sebagai uji ketahanan iman.

Lalu bagaimana dengan kita? Apakah kita sebagai murid Tuhan mau m seperti Nehemia yang rela meninggalkan zona nyamannya, untuk membawa suatu perbedaan di lingkungan kita??

1. Menjadi Terang

Disaat Nehemia ingin membangun kembali tembok yang runtuh, juga ada beberapa kelompok orang Amon, Asdod dan Arab yang tidak senang akan kabar tersebut. Mereka pun datang untuk berkoalisi, mengolok dan mengadakan kekacauan. Ini membuat orang-orang Israel ketakutan dan ingin menyerah. Menghadapi hal ini, Nehemia tidak gentar, tetapi ia tetap beriman dan percaya akan kedahsyatan Tuhan yang senantiasa melindungi mereka. Ia juga mengajak orang-orang Israel untuk tidak takut dan tetap ingat kepada Tuhan (4:14), hingga pada akhirnya tembok tersebut selesai dalam 52 hari. Tidak hanya itu, Nehemia mengajak orang-orang Israel untuk kembali bersukacita dalam mengaku dosa, membuat komitmen dalam persepuluhan, mengingat kembali hari Sabat dan tidak ikut dalam kawin campur (10:29). Dalam pekerjaannya ini, Nehemia juga dibantu oleh Ezra, dan mereka juga melakukan pembacaan hukum Taurat selama 7 hari agar orang-orang Israel mengingat kembali hukum mereka.

Sebagai orang yang cinta Tuhan, Nehemia juga peduli dengan komunitas sekitarnya dan mau menjadi terang bagi mereka. Ia mau mengajak mereka kembali untuk ingat kepada hukum Taurat. Apakah kita juga sudah menjadi terang dan garam dunia, terutama dalam komunitas dan orang-orang sekitar kita? Apakah kita juga sudah bersedia untuk mengingatkan satu sama lain di dalam persekutuan?

Setelah itu, Nehemia pun pergi untuk menghadap raja (13:6) dan ironisnya, saat ia kembali, orang-orang Israel yang tadinya mau diajak untuk kembali kepada hukum Taurat, berubah seperti semula sehingga akhirnya pun Nehemia marah akan hal itu. Pola seperti ini juga sudah sering kita lihat:Bangsa Israel sendiri pun tidak akan bisa berubah.  Hanya salib Yesus Kristus, klimaks dari semua cerita ini, yang memampukan!

Seringkali kita juga merasa bahwa bangsa Israel adalah bangsa yang tidak pernah belajar dari kesalahan, yang sering mengulangi kesalahan yang sama walau sudah ditegur oleh Tuhan. Tapi bukankah itu juga cerminan dari kita masing-masing? Dalam kehidupan kita juga beberapa kali jatuh dalam kesalahan yang sama, dan karena itu, kita juga boleh bersyukur, karena dengan Tuhan Yesus, kita mempunyai pengharapan dan dimampukan untuk bersama melawan dosa-dosa kita.$notes$, $tldr$### **TL;DR PA Besar 11.04.2026: Iman yang membawa perubahan (Nehemia 13)**

PA Besar: Aldi

Nehemia adalah salah satu contoh nyata, bagaimana sikap orang yang cinta Tuhan tercermin dalam perbuatannya. Ia memiliki hati yang ingin melayani dan membawa perbedaan. Walaupun sudah hidup nyaman sebagai juru minum, tetapi hatinya tergerak

mendengar tembok Yerusalem yang hancur , sehingga ia memilih untuk pergi dan memperbaikinya.  Meskipun di sana ada beberapa orang yang ingin mengacaukan rencananya dan menakut-nakuti orang-orang Israel , Nehemia tetap bersandar pada kekuatan Tuhan (2:20) dan mengajak orang-orang Israel untuk percaya pada kuasa Tuhan.

Ketika tembok tersebut selesai dalam 52 hari, Nehemia juga menjadi terang bagi komunitasnya, dengan berkolaborasi bersama Ezra untuk mengajak Israel kembali hidup sesuai hukum Taurat.

Ironi terjadi ketika Nehemia pergi menghadap raja dan  baru saja kembali. Orang-orang Israel kembali pada kebiasaan sebelumnya, membuat Nehemia marah! Bukankah gambaran orang-orang Israel mirip dengan kita, yang awalnya mau berubah (melawan dosa) namun setelah beberapa saat kembali pada kebiasaan sebelumnya? Disini kita juga boleh bersyukur atas salib Tuhan Yesus! Melaluinya kita mempunyai pengharapan dan bersamaNya dimampukan untuk melawan dosa. Maka setelah kita mau mengikuti Yesus, apakah kita juga mau menjadi seperti Nehemia, mempunyai hati yang ingin diubahkan dan menjadi terang dan garam dunia untuk sekitar kita? Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-04-18', 'bible_study', $notes$### **18-04-2026: (Ayub 1-3)**

PA Besar: Billy C. Lugito

Sosok Ayub dikenalkan sebagai seorang yang sangat diberkati dalam hidupnya. Selain kekayaannya yang besar dan keluarganya yang makmur, ia juga dikenal sebagai orang yang saleh dan takut akan Tuhan. Tuhan sendiri menyatakan bahwa Ayub adalah seorang yang benar dan tidak bercela! Namun, di balik kehidupan Ayub yang terlihat sempurna, terjadi sesuatu yang tidak terduga. Dalam waktu yang sangat singkat, Ayub kehilangan hampir segala sesuatu yang ia miliki. Hartanya habis, anak-anaknya meninggal, dan pada akhirnya kesehatannya pun diambil. Penderitaan yang ia alami bukan hanya secara materi, tetapi juga secara emosional dan fisik.

Tapi, respons Ayub sangat menonjol! Ia tetap mengakui bahwa Tuhan adalah yang memberi dan mengambil, dan ia tidak menyalahkan Tuhan (Ayub 1:21–22). Ini menunjukkan bahwa imannya tidak bergantung pada keadaan. Bagaimanapun juga, di pasal 3 Ayub menunjukkan emosinya secara jujur. Ia mulai meratap dan menyesali hari kelahirannya. Namun penting untuk diperhatikan bahwa ia tidak mengutuk Tuhan! Ia tetap bergumul di hadapan Tuhan.

Selanjutnya Ayub bercakap-cakap dengan tiga temannya: Elifas, Bildad, dan Zofar, serta kemudian Elihu (pasal 4-37). Mereka mencoba memahami penderitaan Ayub berdasarkan pemahaman mereka tentang Tuhan. Ketiga teman Ayub berpikir, mengikuti pandangan umum di zaman itu, bahwa Tuhan itu adil dan karena itu setiap penderitaan –termasuk penderitaan Ayub– pasti merupakan akibat dari dosa. Ayub membantah, merasa bahwa dirinya tidak melakukan dosa yang layak menerima penderitaan sebesar itu. Dari sini, Ayub pun mulai bergumul lebih dalam dan bahkan mempertanyakan keadilan Tuhan. Elihu kemudian muncul dengan pandangan yang sedikit berbeda, yaitu bahwa penderitaan bisa menjadi cara Tuhan untuk mendidik dan memperingatkan manusia agar tidak jatuh ke dalam dosa. Meskipun lebih mendekati, penjelasan ini tetap belum memberi jawaban yang memuaskan atas persoalan Ayub.

Dari keseluruhan bagian ini, kita dapat melihat bahwa manusia sering mencoba memahami Tuhan dengan kerangka pikir yang terlalu sederhana. Padahal, realitas kehidupan dan cara Tuhan bekerja jauh lebih kompleks. Disini secara khusus ditunjukkan bahwa tidak semua penderitaan adalah akibat dari dosa pribadi.

Pada akhirnya, Tuhan sendiri menjawab Ayub (pasal 38-42). Namun yang menarik, Tuhan tidak secara langsung memberitahu alasan penderitaan Ayub. Sebaliknya, Tuhan menunjukkan kebesaran dan hikmat-Nya melalui ciptaan-ciptaan-Nya. Ternyata, ada banyak hal di dunia ini yang berada di luar pemahaman manusia! Jika manusia tidak mampu memahami ciptaan sepenuhnya, tentu ia juga tidak dapat sepenuhnya memahami rencana Tuhan! Ayub pun merespon dengan merendahkan diri, mengakui keterbatasannya dan belajar untuk mempercayai Tuhan, karena ia mengenal siapa Dia. Pada akhirnya, Tuhan memulihkan keadaan Ayub, bukan hanya dalam aspek materi, tetapi juga relasi yang lebih dalam dengan-Nya…

Beberapa hal yang dapat kita pelajari dari kitab Ayub:

1. Berpegang pada Tuhan di tengah penderitaan. 
→ Ayub tetap setia, meskipun tidak mengerti apa yang terjadi. Ini mengingatkan kita bahwa hubungan/kepercayaan dengan Tuhan tidak boleh bergantung pada keadaan.
2. Tuhan adalah Bapa yang dekat dan peduli. 
→ Melalui ajaran Yesus, kita mengenal Tuhan sebagai Bapa yang dapat kita datangi dalam doa dan menunjukkan bahwa kita tidak berjalan sendiri dalam penderitaan. Karena ini kita juga dapat berseru, bahkan protes kepada Tuhan, tapi jangan sampai meninggalkan Dia!
3. Penderitaan merupakan bagian dari kehidupan manusia. Bahkan tokoh-tokoh Alkitab seperti Daud dan Paulus juga mengalami kesulitan. Namun mereka tetap melihat pengharapan ke depan, yaitu kemuliaan yang akan datang (2 Kor.4:17).
4. Rencana Tuhan seringkali lebih besar dari apa yang kita pahami. Apa yang pada awalnya terlihat sebagai penderitaan, pada akhirnya dapat memiliki makna dan tujuan dalam rencana Tuhan.

Apakah kita mau mempercayakan hidup kita kepada Tuhan, Bapa kita (Mzm. 33:4)?$notes$, $tldr$### **TL;DR PA Besar 18.04.2026: Awal Penderitaan Ayub (Ayub 1-3)**

PA Besar: Billy

Dalam hidup, seringkali kita bertanya: *mengapa hal buruk bisa terjadi, bahkan kepada orang yang hidup benar?* Kitab Ayub membawa kita masuk ke pergumulan ini. Ayub adalah orang yang saleh, tetapi tetap mengalami kehilangan yang sangat besar seperti harta, keluarga, bahkan kesehatannya. Namun di tengah semua itu, ia tidak meninggalkan Tuhan.

Melalui dialog dengan teman-temannya, kita melihat bagaimana manusia sering mencoba menjelaskan penderitaan dengan cara yang sederhana: bahwa semua penderitaan pasti akibat dosa. Namun kitab Ayub justru menunjukkan bahwa ada hal-hal dalam hidup yang berada di luar pemahaman kita, yang tidak bisa dijelaskan sesimpel itu!

Ketika Tuhan akhirnya berbicara, Ia tidak memberikan jawaban langsung, tetapi menunjukkan kebesaran dan hikmat-Nya. Dari situ Ayub belajar bahwa iman bukan soal memahami semua hal, tetapi mempercayai Tuhan yang memegang kendali.

Lalu bagaimana dengan kita? Di tengah pergumulan, apakah kita tetap berpegang dan berseru pada Tuhan, atau justru menjauh? Apakah kita mempercayai bahwa Tuhan tetap baik, bahkan ketika hidup terasa tidak adil? Ayub juga mengingatkan kita bahwa penderitaan bukan akhir dari cerita. Di baliknya, Tuhan tetap bekerja untuk menggenapi tujuan besar-Nya. Karena itu, kita diajak untuk tetap percaya, tetap dekat dengan Tuhan, dan menyerahkan hidup kita kepada-Nya.

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-04-25', 'church_service', $notes$### **25-04-2026: Kedaulatan Allah atas Penderitaan (Ayub 36:1-26)**

Ibadah: Pdt. John

Di tengah zaman yang penuh tekanan dan arus informasi, tidak sedikit orang Kristen mengalami krisis iman. Pertanyaan yang sering muncul adalah: *“Jika Allah berdaulat, mengapa kita mengalami penderitaan?”*

Melalui Ayub 36, Elihu memberikan perspektif bahwa Allah tidak pernah kehilangan kendali. Penderitaan bukanlah sesuatu yang terjadi di luar kedaulatan-Nya, melainkan memiliki tujuan dalam rencana-Nya.

1. Allah Tetap Berdaulat Meskipun Kita Tidak Mengerti (Ay. 1–5)

Ketika hidup terasa kacau atau doa seolah tidak dijawab, kita mudah mempertanyakan kebaikan dan kedaulatan Tuhan. Namun kita diingatkan Allah tidak pernah meninggalkan umat-Nya. Ia tetap memelihara orang benar (Roma 8:28), meskipun cara-Nya sering kali melampaui pemahaman manusia. Karena itu, respons yang benar bukanlah menuntut penjelasan, melainkan belajar berserah dan berkata, “*Tuhan, aku tidak mengerti, tetapi aku tetap percaya.”*

Kita juga perlu belajar mengurangi keinginan untuk mengontrol segala sesuatu dalam hidup. Daripada terus terjebak dalam kekhawatiran dan overthinking, kita diajak untuk datang kepada Tuhan dalam doa dan refleksi.

2. Allah Memakai Penderitaan untuk Membentuk (Ay. 8–15)

Elihu menjelaskan bahwa penderitaan tidak selalu merupakan hukuman. Tuhan dapat memakai penderitaan sebagai sarana untuk menegur, mendidik, dan membentuk umat-Nya. Bahkan orang yang hidup benar pun seperti Ayub dapat mengalami penderitaan.

Penderitaan adalah sarana teguran dan pembelajaran, memberikan kesempatan agar telinga dan mata rohani kita terbuka untuk melihat apa yang Tuhan kehendaki. Kegagalan dipakai untuk melatih kerendahan hati agar kita tidak sombong, sementara konflik melatih kita mempraktekkan kasih dan pengampunan agar terhindar dari kepahitan. Pada akhirnya, penderitaan diizinkan agar hidup kita semakin berkenan dan serupa dengan Kristus.

Karena itu, daripada hanya bertanya, “*Mengapa ini terjadi?”*, kita diajak untuk bertanya, “*Apa yang Tuhan ingin ajarkan melalui situasi ini?”* Dalam proses tersebut, kita tidak perlu berjalan sendiri. Tuhan menyediakan komunitas, mentor, dan sesama orang percaya untuk saling menguatkan. Kita juga dapat membiasakan diri untuk menjurnal perjalanan iman kita, sehingga kita dapat melihat kembali bagaimana Tuhan telah menolong kita di masa lalu.

3. Allah Tetap Layak Dipercaya karena Kebesaran-Nya (Ay. 22–26)

Pada akhirnya, Elihu mengarahkan fokus Ayub kembali kepada kebesaran Allah. Ia adalah Pribadi yang tidak dapat sepenuhnya dipahami oleh manusia. Iman berarti kita tetap teguh percaya, bahkan pada saat kita tidak bisa memahami realita yang sulit. Kita percaya bahwa Allah yang memegang hidup kita adalah Allah yang berdaulat dan baik.

Sering kali kita terlalu fokus pada masalah yang ada di depan mata, sehingga lupa melihat gambaran besar (big picture) dari apa yang Tuhan sedang kerjakan dalam hidup kita. Padahal, Tuhan tetap bekerja melalui setiap situasi, termasuk melalui penderitaan.

Bangunlah kebiasaan bersyukur, bahkan untuk hal-hal yang kecil, karena rasa syukur akan membawa ketenangan dalam hidup. Ingatlah selalu akan kesetiaan Tuhan di setiap masa, dan tetaplah berfokus kepada kebesaran-Nya.$notes$, $tldr$### **TL;DR Ibadah 25.04.2026: Kedaulatan Allah atas Penderitaan (Ayub 36: 1-26)**

Ibadah: Pdt. John

Di tengah tekanan hidup dan banyaknya pertanyaan, kita sering bertanya mengapa Tuhan mengizinkan penderitaan. Melalui Ayub 36, kita diingatkan bahwa Allah tetap berdaulat dan tidak pernah kehilangan kendali, bahkan ketika kita tidak mengerti apa yang sedang terjadi dalam hidup kita.

Penderitaan bukan selalu tanda hukuman. Tuhan dapat memakainya untuk menegur, membentuk, dan memurnikan hidup kita. Melalui proses yang tidak mudah, kita diajar untuk semakin rendah hati, bergantung kepada Tuhan, dan bertumbuh menjadi semakin serupa dengan Kristus.

Karena itu, kita diajak untuk tidak hanya bertanya “mengapa ini terjadi,” tetapi belajar melihat apa yang Tuhan ingin kerjakan melalui setiap situasi. Di tengah pergumulan, kita tetap dapat datang kepada Tuhan, berdoa, dan berjalan bersama komunitas iman.

Pada akhirnya, Allah tetap layak dipercaya. Ia bekerja dalam segala sesuatu untuk mendatangkan kebaikan, seperti yang diingatkan dalam Roma 8:28. Karena itu, mari tetap percaya dan berharap kepada-Nya dalam setiap keadaan.

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-05-02', 'bible_study', $notes$### **02-05-2026: Ayub III (Keterbatasan Ayub)**

PA Besar : Wynnona

Melalui kitab Ayub 38-42, kita dapat belajar bagaimana Tuhan merespon Ayub yang merasa sombong, karena Ayub merasa bahwa ia berhak untuk memerintah Tuhan atas penderitaan yang ia alami. Dalam kondisinya yang tertekan, Ayub kehilangan rasa syukur dan terjatuh ke dalam sikap merasa paling benar serta kesombongan spiritual, di mana ia mulai mempertanyakan keadilan Tuhan. Menanggapi hal tersebut, Tuhan hadir menegur Ayub melalui badai (sebuah simbol teofani atau kehadiran ilahi yang dahsyat di Alkitab). Namun, kehadiran Tuhan ini bukanlah untuk menghukum, melainkan untuk merestorasi hubungan-Nya dengan Ayub. Tuhan di sini berbicara secara spesifik dan personal kepada Ayub.

Melalui dialog sebelumnya, kita bisa melihat situasi hati awal Ayub, di mana dia tidak merasa berdosa dan bersalah. Ayub merasa paling benar dan banyak mempertanyakan keadilan Tuhan. Di sisi lain, Tuhan menegaskan keterbatasan pengertian dan pengetahuan Ayub, menunjukkan bahwa ada banyak hal yang tidak dimengerti oleh akal manusia. Tuhan memiliki pengetahuan, kedaulatan dan otoritas di atas Ayub dan kebesaran Tuhan bahkan melebihi seluruh alam semesta. Lewat dialog ini Tuhan ingin membetulkan cara pikiran Ayub.

Pengajaran langsung dari Tuhan ini akhirnya membawa Ayub pada titik kesadaran, bahwa ia menyesali kesombongannya dan memutuskan untuk bertobat. Ayub pun mengalami perubahan sikap hati (dari yang merasa paling baik menjadi merasa yang paling hina) dan restorasi hubungan Ayub dengan Tuhan terjadi.

Kisah ini menjadi refleksi penting bagi setiap orang saat dihadapkan pada penderitaan, apakah kita akan terjebak pada sikap merasa paling benar, atau justru menyadari keterbatasan kita dan tetap percaya bahwa Tuhan yang memegang kendali penuh atas segala sesuatu. Kedatangan Tuhan pada akhirnya bertujuan untuk memulihkan kerohanian Ayub, memberikan pandangan yang baru, dan menyadarkannya bahwa hikmat Tuhan jauh melampaui logika manusia. Kita juga bisa belajar dari hati pertobatan Ayub, yang hatinya mau diubahkan oleh Tuhan lewat teguranNya.$notes$, $tldr$### **TL;DR PA Besar 02.05.2026 : Ayub III: Keterbatasan Ayub (Ayub 38-42)**

PA Besar: Ci Wynnona

Dari Ayub kita dapat belajar, bagaimana sikap kita seharusnya ketika kita sedang melalui penderitaan. Bukan seperti Ayub yang bersikap arogan dan sombong, sehingga ia harus ditegur Tuhan. Melalui fenomena badai, Tuhan hadir bukan untuk menghukum, melainkan untuk merestorasi hubungan mereka dengan cara mengingatkan Ayub akan keterbatasan manusia dan kedaulatan Tuhan yang mutlak.

Melalui teguran keras dari Tuhan, Ayub akhirnya menyadari kesalahannya, bertobat, dan mengakui bahwa hikmat Tuhan jauh melampaui logika manusia. Kisah ini menjadi pengingat bagi kita agar tidak merasa paling benar saat menghadapi ujian, melainkan tetap percaya bahwa Tuhan memegang kendali penuh atas segala sesuatu.

Pernahkah kita merasa lebih tahu dari Tuhan? Ketika kita dihadapkan oleh penderitaan, pernahkah kita merasa paling benar di hadapan Tuhan seperti Ayub?

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-05-09', 'church_service', $notes$### **09-05-2026: The Embodied Christian (1 Yoh. 1:1-4)**

Ibadah: Ev. Riggruben

Kita hidup di era postmodern dengan keunikan dan tantangannya sendiri, salah satunya dalam hal relasi. Kata *parasocial* menggambarkan gejala tersebut: seseorang merasa ada keterikatan/koneksi dengan orang-orang terkenal, atau bahkan karakter-karakter fiksi, yang tidak ia kenal. Ini menunjukkan adanya distorsi dalam cara memandang sebuah relasi. Sementara itu, kita yang hidup di zaman ini, pasti akan turut berpengaruh dalam cara kita memandang dan menghidupi iman kristen, yang berdasar pada relasi. Kekristenan cenderung menjadi kepercayaan abstrak saja tanpa perlu perwujudan yang nyata, tanpa kebenaran secara historis. Konsep ini sebenarnya menjadi bibit dari ajaran Gnostik, yang mengkonsepkan kekristenan sebagai “agama hati” dan mempunyai fungsi terapeutik saja. Bagaimana Firman Tuhan menjawab pandangan ini?

Rasul Yohanes, penulis kitab 1 Yohanes, berusaha memerangi ajaran Gnostik yang mulai berkembang dan tersebar di zamannya. Ia bersaksi, bahwa Kristus Yesus –inti kekristenan– bukan sebuah ide abstrak; Ia adalah Tuhan yang berinkarnasi, sepenuhnya **terwujud** dalam materi. Ia benar-benar hidup di antara kita sebagai manusia, menunjukkan dengan jelas seperti apa Tuhan itu, dan relasi yang benar dengan Dia. Terlebih lagi, inkarnasi-Nya penting karena sebagai sesama manusia, Yesus bisa menjadi penebus kita sekaligus imam yang mengerti kelemahan kita! Jadi kita justru harus bersyukur karena iman kekristenan adalah iman yang **terwujud:** yang nyata, dapat dirasakan semua orang, bukan sekedar sebuah ide untuk kaum-kaum elit. Implikasinya, dalam kehidupan kristen, kita harus terus merenungkan: Bagaimana Kristus bisa dirasakan, dilihat dan didengar lewat kehidupan sehari-hari kita, dalam segala aspek?

Selanjutnya rasul Yohanes juga membahas tentang persekutuan tubuh Kristus, yaitu antara sesama orang percaya. Ini juga merupakan bentuk perwujudan (*embodiment*) nyata dari iman Kristen! Iman Kristen bukanlah iman yang hanya memikirkan diri sendiri, yang hanya dihidupi sendiri di hadapan Tuhan. Sayangnya, baik di masa Yohanes maupun sekarang, persekutuan/gereja bisa kehilangan kehangatan dan relasi mereka. Padahal, dasar dari persekutuan/pertemanan kristen adalah kasih Kristus sendiri: kita sama-sama sudah menerima pengorbanan dan kasih-Nya (Yoh. 15:13), juga mempunyai tujuan hidup yang sama yaitu mengasihi Dia. Maka siapakah diri kita, tidak mau berteman dengan saudara/saudari kita? Kiranya kasih Kristus terwujud dalam persekutuan kita, sampai seluruh anggotanya juga bisa merasakan hal itu!

Kristus bukan hanya ide yang mengawang-awang. Fokus iman kita bukan hanya hidup kekal yang akan datang, tapi juga hidup yang sekarang kita jalani di dunia ini!$notes$, $tldr$### **TL;DR Ibadah 09.05.2026 : The Embodied Christian (1 Yoh. 1:1-4)**

Ibadah: Ev. Riggruben

Rasul Yohanes, dalam suratnya berusaha memerangi ajaran Gnostik, yang mulai tersebar luas di zamannya. Ajaran ini memandang iman kristen sebagai kepercayaan abstrak saja, tidak perlu mempunyai fondasi sejarah, tidak perlu benar-benar **nyata**. Maka tujuan kekristenan hanyalah untuk memberi manfaat terapeutik bagi diri/kelompok pribadi. Sayangnya, cara pandang ini juga masih ada di lingkungan kita sekarang!

Yohanes menegaskan, bahwa iman kristen pada dasarnya adalah iman yang **terwujud**/*embodied*: Yesus Kristus benar-benar menjadi manusia, hidup di antara kita, juga menebus kita. Ia bukan ide abstrak, tapi perwujudan nyata dari Tuhan sendiri yang dapat kita rasakan! Maka untuk mengikut Dia, kita harus pula merenungkan, “bagaimana Kristus dapat dirasakan/disaksikan orang lain lewat hidupku sehari-hari?”

Salah satu bentuk perwujudan iman kita adalah dalam persekutuan dengan sesama orang percaya (gereja). Ingatlah bahwa kita adalah orang-orang yang sudah mengalami kasih dan persekutuan dengan Tuhan, maka sudah sepatutnya kita mau bersekutu dengan saudara/saudari kita! Bagaimana kasih Kristus dapat terwujud di persekutuan kita?

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-05-16', 'bible_study', $notes$### **16-05-2026: Allah adalah Terang (1 Yohanes 1:5-10)**

PA Besar : Ido

Surat Yohanes ditujukan secara khusus untuk para jemaat di bagian Asia Minor untuk menjawab kebimbangan mereka di tengah-tengah antikristus dan ajaran sesat yang tersebar di kala itu. Salah satu teori yang beredar saat itu menganggap bahwa Allah tidak sepenuhnya baik. Konsep ini ingin diluruskan oleh Yohanes karena sejatinya terang tidak bisa bercampur dengan kegelapan (dosa).

Oleh karena itu, Yohanes membuka suratnya dengan memperkenalkan kembali konsep terang, sebuah kata yang sudah dipakai di dalam kisah penciptaan untuk memaknai sesuatu yang baik. Kata terang juga beberapa kali muncul dalam Injil, seperti penggambaran Yesus sebagai terang dunia (Yoh 8:12) dan semua yang mengikutiNya adalah anak-anak dari terang (Ef 5:8).

Dalam isi suratnya Yohanes memberikan perbandingan, di mana ketika seseorang beroleh persekutuan dengan Tuhan, tetapi masih hidup dalam kegelapan, maka sebenarnya mereka tidak melakukan kebenaran (ayat 6). Di sisi lain, orang-orang yang mengaku diri mereka tidak berdosa, maka Yohanes menyebut mereka telah menipu dirinya sendiri dan menghujat Tuhan (ayat 8 & 10).

Lalu bagaimana kita bisa hidup dalam terang, kalau sejatinya tidak akan ada manusia yang tidak berdosa? Bagi Yohanes, untuk bisa hidup dalam terang, maka setiap dari kita perlu disucikan oleh darah Yesus dengan cara hidup sesuai keinginan Tuhan dan mengaku dosa. Akan tetapi, seringkali sebagai manusia kita enggan untuk mengaku dosa akibat beberapa faktor: seperti adanya ketakutan, merasa mempunyai *pride* yang harus dijaga, dan rasa *ignorance* untuk mengaku dosa. Di sisi lain kita tidak perlu takut untuk mengaku dosa karena Allah kita juga sudah memberikan janji pada kita, bahwa Ia adalah Allah yang setia dan adil, yang selalu siap menerima kita dalam keadaan apapun. Oleh karena pengorbanan Yesus, darahnya boleh tercurah bagi kita, supaya kita juga boleh disucikan dari segala kejahatan (ayat 9).

Untuk bisa hidup dalam terang pengakuan dosa menjadi penting karena setelah kita mengaku dosa, maka lahir juga pertobatan yang membawa kita dalam kekudusan. Oleh karena itu, masing-masing dari kita juga hendaknya merenungkan, apakah kita bisa melihat keberdosaan dalam diri kita yang mengharuskan kita untuk mengaku dosa untuk disucikan dalam darah Yesus.$notes$, $tldr$### **TLDR PA BESAR 16-05-2026: Allah adalah Terang (1 Yohanes 1:5-10)**

Surat Yohanes ditujukan secara khusus untuk para jemaat di bagian Asia Minor untuk menjawab kebimbangan mereka di tengah-tengah antikristus dan ajaran sesat yang tersebar di kala itu. Salah satu teori yang beredar saat itu menganggap bahwa Allah tidak sepenuhnya baik. Konsep ini ingin diluruskan oleh Yohanes karena sejatinya terang tidak bisa bercampur dengan kegelapan (dosa).

Oleh karena itu, ada beberapa hal yang ingin ditekankan kembali oleh Yohanes:

- Konsep terang adalah sesuatu yang baik (Kejadian 1:3), maka Allah sebagai terang adalah sepenuhnya baik dan dalam Dia tidak ada kegelapan (dosa) \[ayat 5\].
- Untuk menjadi anak-anak dari terang itu, kita yang berdosa perlu disucikan oleh darahNya dan hidup dalam terang.

Namun sejatinya kita semua telah berdosa dan kehilangan kemuliaan Allah (Rm 3:23). Oleh karena itu, pengakuan dosa menjadi cara untuk membawa kita dalam pertobatan dan menjadikan hidup kita untuk kemuliaan Allah. Masing-masing dari kita juga hendaknya merenungkan, apakah kita bisa melihat adanya keberdosaan dalam diri kita yang mengharuskan kita untuk mengaku dosa untuk disucikan dalam darah Yesus.

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-05-23', 'church_service', $notes$### **23-05-2026: Mengikut Yesus di Dunia Nyata (1 Yohanes 2:1-6)**

Ibadah : Pdt. John

Hari-hari ini kita hidup di dunia yang sangat peduli dengan identitas. Tanpa sadar, kita yang hidup di dalam dunia yang menuntut identitas yang sempurna bisa ikut terbawa dalam tekanan untuk terlihat berhasil, pintar, rohani, kuat, dan tidak gagal. Namun melalui Firman Tuhan, Yohanes mengajak kita melihat pertanyaan yang lebih dalam: bagaimana kita tahu bahwa kita sungguh-sungguh mengenal Kristus?

Yohanes mengingatkan bahwa pengikut Kristus yang sejati terlihat dari cara hidupnya sehari-hari. Orang bisa terlihat rohani di momen tertentu, tetapi yang lebih penting adalah konsistensi hidup kita dalam keseharian. Dari 1 Yohanes 2:1–6, kita belajar bahwa pengikut Kristus yang sejati memiliki beberapa tanda:

**1. Sadar bahwa saat jatuh dalam dosa, kita punya Pembela yang sempurna (ay 1-2)**

Orang Kristen masih bisa gagal dan berbuat dosa, tetapi orang yang sungguh ada di dalam Tuhan tidak akan nyaman hidup dalam dosa dan ada kegelisahan karena hatinya sedang dibentuk oleh Tuhan.

Namun kabar baiknya, saat kita jatuh, kita tidak perlu lari dari Tuhan. Kita tahu harus kembali kepada  Yesus Kristus sebagai Pengantara dan Pembela kita di hadapan Bapa. Jangan percaya bahwa kita terlalu kotor untuk datang kepada Tuhan karena Ia sudah membayar dosa kita melalui pengorbananya di kayu salib.

**2. Menunjukkan kasih melalui ketaatan yang nyata (ay 3-4)**

Yohanes mengatakan bahwa bukti seseorang mengenal Tuhan bukan hanya perasaan rohani, tetapi hidup yang taat dan kedekatan dengan Tuhan yang terlihat dari hidupnya yang berubah. Lewat perubahan hidup ini, seharusnya ada kasih yang sejati yang nyata dalam kehidupan sehari-hari kita.

Contoh praktek kasih yang sejati:

- jujur saat mengerjakan ujian
- setia pada komitmen
- menghargai orang lain dan tidak meremehkan mereka
- mengampuni, bukan menyimpan kepahitan
- peduli kepada teman yang kesepian
- tidak memanfaatkan kelemahan orang lain
- tetap hidup kudus saat tidak ada yang melihat

Jadi pertanyaannya bukan seberapa sering kita menyebut nama Tuhan, tetapi apakah hidup kita menunjukkan karakter Kristus. Apakah orang lain bisa melihat Kristus dari cara kita memperlakukan mereka? Apakah kita hadir saat orang lain membutuhkan? Apakah kita tetap punya integritas ketika tidak ada yang memperhatikan?

**3. Belajar semakin serupa dengan Kristus dalam keseharian (ay 5-6)**

Kalau kita mengatakan bahwa kita mengikut Yesus, maka hidup seperti Yesus bukan pilihan tambahan, melainkan panggilan utama. Tuhan ingin hidup kita bukan hanya berisi pengakuan iman, tetapi juga hidup yang mencerminkan Kristus.

Hidup seperti Yesus berarti kita belajar memiliki:

- hati yang penuh kasih dan belas kasihan
- kekudusan
- keberanian untuk tidak kompromi dengan dosa
- kesediaan untuk menegur dengan kasih dan kerendahan hati ditegur saat kita salah

Karena itu, jangan menjadi orang Kristen yang hanya ***“NATO” — No Action Talk Only***. Justru di tengah keseharian kita sekarang, kita belajar membangun relasi dengan Tuhan dan mengasihi orang lain secara konkret.

Aplikasinya bisa dimulai dari hal-hal sederhana:

- membangun disiplin rohani dan relasi pribadi dengan Tuhan
- mendengarkan teman dengan sungguh-sungguh
- menolong tanpa pamrih
- memberi perhatian kepada orang yang sedang bergumul
- menjadi terang di tempat Tuhan menempatkan kita
- membawa pengharapan, integritas, damai, dan belas kasihan.

Pada akhirnya, Yohanes mengingatkan bahwa Tuhan tidak menuntut kita langsung sempurna sekarang, tetapi Tuhan mau kita terus berproses untuk semakin serupa dengan Kristus. Maka pertanyaannya untuk kita: apakah kita sungguh mengenal Kristus? Apakah hidup kita semakin menyerupai Dia? Apakah kasih kita hanya teori atau sudah menjadi tindakan nyata?

Kekristenan sejati adalah bagaimana kita menghadirkan kehidupan seperti Yesus di tengah dunia ini. Tuhan mau kita menjadi pengikut-Nya yang setia, bukan hanya di gereja, tetapi juga dalam keseharian kita.$notes$, $tldr$### **TL;DR Ibadah 23.05.2026 : Mengikuti Yesus di Dunia Nyata (1 Yoh. 2:1-6)**

Di dunia modern, kita hidup di dunia yang sangat peduli dengan identitas. Yohanes mengajak kita melihat pertanyaan yang lebih dalam: identitas kita sebenarnya ada di mana? Apakah kita sungguh-sungguh mengenal Kristus? Firman Tuhan mengingatkan kita bahwa menjadi pengikut Kristus sejati memiliki berapa tanda:

1. Bisa jatuh, tapi kita sadar punya Kristus sebagai Pembela (ay 1-2)
Menjadi orang Kristen bukan berarti kita langsung sempurna dan tidak pernah berdosa lagi. Namun saat kita jatuh, kita tidak perlu lari dari Tuhan karena kita punya Yesus Kristus sebagai Pengantara dan Pembela kita.

2. Menunjukkan kasih lewat ketaatan yang nyata (ay 3-4)
Mengenal Tuhan bukan hanya soal perasaan rohani, tetapi hidup yang taat dan berubah. Lewat hidup yang berubah seharusnya ada kasih yang sejati yang dinyatakan. Kasih praktis bisa terlihat dalam hal sederhana: jujur saat ujian, setia pada komitmen, mengampuni, menghargai orang lain, peduli kepada teman, tidak memanfaatkan kelemahan orang, dan tetap hidup kudus saat tidak ada yang melihat.

3. Belajar semakin serupa dengan Kristus (ay 5-6)
Mengikut Yesus berarti hidup kita perlahan dibentuk menjadi seperti Dia: penuh kasih, rendah hati, kudus, peduli, dan berani menegur dengan kasih. Kekristenan bukan hanya ***“No Action Talk Only”***, tetapi iman yang terlihat dalam tindakan nyata.

Jadi, mari kita bertanya: apakah hidup kita makin menyerupai Kristus? Apakah orang lain bisa melihat kasih Yesus melalui kita?

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-05-30', 'bible_study', $notes$### **30.05.2026 Mengikut Yesus dalam Terang dan Kasih (1 Yohanes 2 : 7-17)**

PA Besar: Chen

Surat 1 Yohanes ditulis oleh Rasul Yohanes kepada jemaat di Asia Kecil dengan tujuan untuk menangkal ajaran palsu (Gnostik). Yohanes mengajak jemaat untuk menguji kembali iman mereka dan merenungkan apa sebenarnya arti sejati dari mengikut Yesus. Lewat kitab 1 Yohanes, Yohanes menyatakan bahwa kekristenan yang sejati harus dibangun di atas 3 fondasi yaitu behavioral (gaya hidup seperti Yesus), relational dan doctrinal (Kebenaran tentang Allah dan Kristus) foundation.

Dalam bagian 1 Yohanes 2:7–17, kita melihat terutama fondasi relasional yang diwujudkan melalui kasih.

1. **Kasih (ayat 7-11)**

- **Memahami Kasih Kristus (ayat 7-8)**

Perintah untuk mengasihi sesama sesungguhnya bukanlah hal yang baru; ini adalah perintah lama yang sudah dicatat sejak zaman Imamat 19:18. Namun, perintah ini menjadi "baru" karena telah disempurnakan oleh Yesus Kristus melalui kehidupan, kematian, dan kebangkitan-Nya. Pada dasarnya, manusia berdosa tidak mampu mengasihi dengan sempurna karena kita mengasihi dengan syarat, terbatas, dan sering berpusat pada diri sendiri.

Hanya Yesus — yang tidak berdosa — yang mampu mewujudkan kasih yang utuh untuk melenyapkan dosa. Kasih Kristus itu lemah lembut, tanpa syarat, rela berkorban, tidak menuntut balasan, dan menyertai kita kekal selamanya, bahkan di tengah penderitaan.

- **Menggunakan Kasih Kristus untuk mengasihi sesama (ayat 9-11)**

Terang dan kasih adalah dua hal yang saling melengkapi dan tidak bisa dipisahkan. Seseorang tidak bisa mengaku mengenal Tuhan jika ia masih membenci saudaranya (sesama orang percaya) (ayat 9).

Ada beberapa kemungkinan mengapa ada orang yang mengaku mengenal kebenaran tetapi kurang mengasihi:

1. **Mengenal kebenaran hanya secara informasi.** Mereka tumbuh di lingkungan Kristen, tetapi tidak sungguh-sungguh menerima Kristus secara pribadi.
2. **Sikap superioritas rohani.** Mereka senang berdebat dan memenangkan argumen, tetapi tidak berusaha memenangkan hati orang. Mereka mencari jawaban hanya untuk memuaskan pikiran sendiri, bukan untuk semakin mengenal Tuhan dan mengasihi sesama.
3. **Idola.** Mereka menerima semua yang dikatakan tokoh tertentu tanpa memeriksanya kembali berdasarkan Firman Tuhan.

Kesamaan dari ketiga contoh ini adalah sumber kebenaran berasal dari manusia, bukan dari Tuhan. Akibatnya, mereka kehilangan gambaran tentang hidup sejati.

Dalam memahami arti kebenaran yang sejati, kita harus memiliki relasi yang pribadi dengan Tuhan. Kita harus menyadari bahwa kita adalah orang berdosa yang membutuhkan anugerah-Nya. Dengan membandingkan diri kita dengan standar kekudusan Tuhan, kita yang tak layak lalu menerima anugerah besar Kristus jadi mampu mengasihi sesama.

2. **Mengasihi Dunia? (ayat 15-17)**

Meskipun kita dipanggil untuk mengasihi sesama, Yohanes dengan tegas memperingatkan kita untuk tidak mengasihi dunia. Peringatan ini seringkali disalah pahami. Dalam Yohanes 3:16 dikatakan bahwa Allah sangat mengasihi dunia ini. Segala materi yang Tuhan ciptakan pada dasarnya adalah baik dan tidak untuk dibenci. Di sisi lain, yang Yohanes tantang adalah mengasihi “keduniawian” - yaitu prinsip hidup yang menjadikan dunia dan segala isinya sebagai segalanya dalam hidup kita. Kita harus menyadari bahwa hidup ini jauh lebih besar dari sekadar apa yang ada di bumi, dan mulai melihat dari perspektif kekekalan.

3. **Encouragement (ayat 12-14)**

Pada akhirnya, Yohanes memberikan dorongan kepada seluruh pembacanya berdasarkan fase pertumbuhan rohani mereka: baik “anak-anak” (yang baru lahir baru dan dosanya diampuni), “orang muda” (yang sudah kuat mengalahkan si jahat), maupun “bapak-bapak” (yang telah mengenal Tuhan sejak semula). Di fase pertumbuhan rohani mana pun kita berada, kita semua memiliki kapasitas untuk mengasihi karena kemampuan mengasihi tidak berasal dari kekuatan diri sendiri, melainkan dari hubungan kita dengan Tuhan.$notes$, $tldr$### **TL;DR PA BESAR 30.05.2026 : Mengikut Yesus dalam Terang dan Kasih (1 Yohanes 2 : 7-17)**

PA Besar: Chen

Melalui suratnya, Rasul Yohanes mengajak kita untuk menguji kembali iman kita dan membuktikan pengenalan kita akan Tuhan melalui gaya hidup yang saling mengasihi.

1. **Kasih yang Disempurnakan:** Perintah mengasihi adalah perintah lama yang menjadi baru karena Yesus telah menunjukkan kasih yang sempurna melalui hidup dan pengorbanan-Nya. Karena manusia berdosa tidak mampu mengasihi dengan sempurna, kita harus terlebih dahulu menerima kasih Kristus sebelum dapat mengasihi orang lain dengan benar.
2. **Terang dan Kasih Tidak Terpisahkan:** Kita tidak bisa mengaku hidup dalam terang jika masih membenci saudara kita. Semakin kita menyadari akan besarnya dosa kita dan besarnya anugerah-Nya bagi kita, semakin kita dimampukan untuk mengasihi sesama.
3. **Jangan Mengasihi Keduniawian:** Allah mengasihi ciptaan-Nya, tetapi kita dilarang untuk mengasihi dunia, yaitu menjadikan hal-hal duniawi sebagai pusat hidup kita. Sebaliknya, kita dipanggil untuk hidup dengan perspektif kekekalan dan melakukan kehendak Allah.

Di fase rohani mana pun kita berada — baik baru mengenal Tuhan maupun sudah lama percaya — kita semua memiliki kapasitas untuk mengasihi, yang hanya bisa didapatkan melalui pengenalan pribadi dengan Tuhan.

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-06-06', 'bible_study', $notes$### **07.06.2026 Tinggal di Dalam Anak (1 Yohanes 2 : 18-27)**

PA Besar: Steffen

Rasul Yohanes menulis surat-suratnya karena munculnya guru-guru palsu yang memecah belah jemaat, sesuai dengan nubuat Yesus yang tertulis di kitab-kitab Injil. Salah satu ajaran sesat yang diberitakan adalah ajaran Gnostik, yang menganut bahwa keselamatan seseorang bergantung pada memiliki suatu pengetahuan “khusus”/rahasia: bahwa Yesus bukan Tuhan, Ia hanya sebuah roh dan karena itu tidak pernah bereinkarnasi. Hal ini tampak seperti detail doktrin yang sepele, tapi menurut Yohanes, ini adalah masalah kebenaran! Menyimpang dari doktrin yang sehat berarti menyesatkan orang dari kebenaran.

Oleh karena itu, kita juga perlu memegang teguh doktrin Kristen yang telah diajarkan kepada kita, terutama tentang kabar baik penebusan Kristus. Kita juga perlu berhati-hati karena ternyata ajaran sesat juga bisa ditemukan di dalam gereja (2:19) dan tidak selalu mudah dikenali. Bagaimanapun, inti dari ajaran-ajaran sesat tersebut - contohnya Gnostik - adalah "Yesus tidak cukup". "Kita mungkin sudah menerima Yesus, tapi bukankah perlu beramal? Perlu harta? Memiliki suatu pengetahuan yang tersembunyi? Atau ketenaran", adalah contoh manifestasi ajaran sesat tersebut.

Rasul Yohanes kemudian mengingatkan, bahwa orang-orang percaya sudah diurapi oleh Roh Kudus! Ini berarti mereka sebenarnya sudah mengetahui kebenaran (2:20-21) dan tidak perlu lagi mendengar ajaran para guru palsu! Dengan pertolongan Roh Kudus, orang-orang percaya bisa mengenal Tuhan dengan benar. Menarik juga untuk kita perhatikan, bahwa kata yang dipakai untuk "pengurapan" (misal 2:20) adalah *chrisma*, yang artinya mirip dengan *Christos* (Kristus, Yang Diurapi). Ini menunjukkan hubungan erat yang dimiliki orang percaya dengan Yesus Kristus sendiri melalui Roh Kudus! Dengan ini Yohanes kembali menekankan kecukupan mutlak Kristus untuk setiap orang percaya.

Lalu apa yang harus dilakukan orang percaya, khususnya di tengah-tengah banyaknya ajaran palsu? Rasul Yohanes mengingatkan mereka untuk tinggal di dalam Sang Anak dan Sang Bapa (2:24). "Tinggal di dalam-Nya" berarti memelihara hubungan yang erat dan konstan dengan Dia, memegang teguh ajaran-ajaran-Nya (2:24), serta menjadikan Kristus pusat kehidupan kita. Praktiknya sederhana, yaitu dengan memelihara kehidupan doa, perenungan Firman Tuhan, kehidupan persekutuan (bergereja) secara rutin serta ketaatan terhadap segala perintahNya. Dalam jangka panjang, kita pun akan semakin dibentuk serupa Kristus dan makin mengenali kehendak-Nya, apa yang berkenan kepada-Nya. Lalu, jika kita tetap tinggal di dalam-Nya sampai akhir, maka kita menunjukkan bahwa kita adalah orang percaya sejati (2:19).

Apakah kita masih sering tergoda untuk mengejar hal-hal lain, misal kekayaan, ketenaran, atau mungkin perbuatan baik untuk memberi diri kita kepuasan/ketenangan? Dengan kata lain, apakah Yesus cukup untuk kita? Sudahkah pula kita memegang teguh kebenaran-kebenaran yang sudah diajarkan Roh Kudus kepada kita? Marilah kita terus tinggal di dalam Sang Anak!$notes$, $tldr$### **TL;DR PA BESAR 07.06.2026 : Tinggal di Dalam Anak (1 Yohanes 2 : 18-27)**

PA Besar: Steffen

Di waktu penulisan surat 1 Yohanes, ajaran-ajaran sesat mulai masuk ke dalam gereja. Salah satunya adalah ajaran Gnostik, yang mengajarkan bahwa Yesus bukanlah Tuhan. Selain itu, diajarkan juga bahwa Ia bahkan tidak berinkarnasi! Respons tegas Yohanes menunjukkan bahwa masalah doktrin & pengajaran adalah hal yang penting dan harus diperhatikan. Kita juga disuruh berhati-hati dan tetap memegang teguh kebenaran karena ajaran sesat bisa mempengaruhi kita tanpa kita sadari dan bahkan bisa datang dari dalam gereja.

Bagaimana kita bisa tahu kebenaran? Kalau kita orang percaya, maka Roh Kuduslah yang sudah mengurapi dan akan mengajar kita. Maka yang perlu kita lakukan adalah tinggal di dalam Tuhan, yaitu tetap memegang teguh kebenaran Firman-Nya, memelihara hubungan erat dengan Dia, dan taat senantiasa kepadaNya. Hal ini terwujud melalui hal-hal sederhana: doa, perenungan Firman Tuhan dan juga persekutuan dengan orang percaya lainnya.

Dengan demikian kita belajar bahwa segala yang kita butuhkan sudah ada dalam Kristus! Kita tidak perlu ajaran lain, metode pertumbuhan rohani yang kompleks, dll. Fokus kita cukuplah untuk tetap tinggal dalam Dia!

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-06-13', 'church_service', $notes$### **13-06-2026: Identitas Orang Percaya (1 Yohanes 2:28-3:10)**

Ibadah : Ko Willy

Semua dari kita hidup berdasarkan identitas kita masing-masing. Identitas diri seseorang bisa terbentuk dari pengaruh keluarga, jenis kelamin, budaya dan etnis, serta pengalaman pribadi. Lalu bagaimana dengan aspek spiritual identitas kita? Apakah kita adalah orang percaya sejati?

Seperti yang sudah dibahas sebelumnya, surat 1 Yohanes dituliskan untuk menentang paham Gnotisisme yang sedang beredar, yang memercayai bahwa keselamatan diperoleh melalui pengetahuan (Gnosis). Salah satu jenis paham Gnotisisme adalah Gnotis Doketis, yang menolak kemanusiaan Kristus dan kesenangan duniawi karena dunia materi sejatinya adalah jahat (asketisisme). Di sisi lain, ada Gnotis Antinomian yang memisahkan teologi dari etika/moralitas, serta memperbolehkan tubuh mengejar kesenangan duniawi karena hal-hal duniawi sejatinya terpisah dari hal-hal rohani.

Berdasarkan perikop ini, identitas diri orang percaya dapat ditinjau dari dua sudut pandang, yaitu dari pengharapannya akan kedatangan Kristus yang kedua kali (1 Yoh 2:28-3:3) dan ketidakselarasan dosa di dalam hidupnya (1 Yoh 3:4-10).

Kita sebagai orang percaya yang mengharapkan kedatangan ke-2 Kristus hendaknya tinggal di dalam Dia. Kata “tinggal” sendiri (ay 2:28) dalam bahasa Yunani secara gramatik bernuansa suatu tindakan aktif dan berbentuk imperatif / perintah. Kita yang tinggal dalam Kristus akan berani dan tidak malu menghadap Kristus pada hari kedatangan-Nya (ay 2:28). Lalu, orang yang percaya akan membiasakan diri melakukan kebenaran (ay 2:29), yaitu perbuatan-perbuatan baik, sebagai bukti nyata iman kepada Tuhan. Mereka juga akan menghargai kasih karunia Allah dengan cara mengikuti natur Sang Juruselamat, yang sudah mengangkat orang percaya sebagai anak-anakNya (ay 3:1). Kemudian, mereka yang percaya akan memiliki pengharapan untuk menjadi sama seperti Kristus dan menyucikan diri, seperti Allah sendiri adalah suci (ay 3:3). Terlebih lagi, Allah telah berjanji akan mengubah kita menjadi sama seperti Dia (ay 3:2). Ini harusnya menjadi motivasi bagi kita untuk menyucikan diri.  Roh Kudus sendiri membantu penyucian kita, tapi dari diri kita juga harus lahir kemauan dan usaha untuk hidup suci. Salah satu aspek hidup suci adalah menaati Firman dengan integritas.

Kemudian, orang yang benar-benar percaya akan memiliki pergumulan dengan dosa dalam kehidupannya. Salah satu alasannya adalah karena dosa adalah pelanggaran dan pemberontakkan terhadap hukum Allah (ay 3:4). Dosa juga tidak sesuai dengan karya keselamatan Kristus, yang mematahkan kuasa dosa, sehingga orang percaya akan bergumul sebelum melakukan tindakan dosa (ay 3:5-7). Dengan ini, Yohanes menentang  orang-orang yang membenarkan tindakan dosa mereka (ref. 1 Yoh. 1:8). Iblis juga masih mampu merayu kita setelah kekalahannya dari Kristus (ay 3:8), sehingga kita harus senantiasa berjuang dan berperang dengan dosa. Lalu, tindakan dosa juga tidak sesuai dengan pekerjaan Roh Kudus (ay 3:9), yang oleh-Nya orang percaya mengalami kelahiran baru. Karena kelahiran baru, mereka tidak akan terbiasa/nyaman melakukan dosa terus-menerus!

Sebagai perenungan bagi kita, apakah kita telah sungguh-sungguh menjadi anak-Nya? Apakah kita yang telah menerima Yesus mengalami suatu perubahan dalam hidup kita, menjadi semakin serupa Dia? Apakah tindakan kita dilakukan untuk kemuliaan Tuhan / ego sendiri?$notes$, $tldr$### **TL;DR Ibadah 13.06.2026 : Identitas Orang Percaya (1 Yohanes 2 : 28-3:10)**

Ibadah: Ko Willy

Bagaimana kita mengenali orang percaya sejati? Identitas diri orang percaya dapat ditinjau dari dua sudut pandang, yaitu dari pengharapannya akan kedatangan ke-2 Kristus (1 Yoh 2:28-3:3) dan ketidakselarasan dosa di dalam hidupnya (1 Yoh 3:4-10).

Orang percaya, yang mengharapkan kedatangan ke-2 Kristus, akan tinggal di dalam Kristus (ay 2:28), melakukan kebenaran (ay 2:29), menghargai kasih karunia Allah (ay 3:1), memiliki pengharapan untuk menjadi sama sepertiKristus (ay 3:2), serta menyucikan diri dari segala dosa (ay 3:3). Semua ini adalah bukti nyata iman sejati dalam Kristus!

Kemudian, orang yang benar-benar percaya akan memiliki pergumulan dengan dosa karena dosa adalah pelanggaran terhadap hukum Allah (ay 3:4), tidak sesuai dengan karya keselamatan Kristus (ay 3:5-7) serta natur-Nya (ay 3:8), dan juga tidak sesuai dengan pekerjaan Roh Kudus (ay 3:9).

Sebagai perenungan bagi kita, apakah kita telah sungguh-sungguh menjadi anakNya? Apakah kita yang telah menerima Yesus semakin menjadi serupa Dia? Apakah tindakan kita dilakukan untuk kemuliaan Tuhan / ego sendiri?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-06-20', 'bible_study', $notes$### **20-06-2026: Kasih (1 Yohanes 3:11-18)**

PA Besar Aldi

Apa sebenarnya identitas orang percaya dan apa yang menjadi dasar penting bagi orang percaya? Dalam mengikut Kristus, Yohanes menekankan poin-poin penting, seperti: doktrin yang benar akan menghasilkan pengertian dan kepatuhan yang benar, Yesus sebagai dasar keselamatan dan pengharapan, dan menekankan hidup yang bertentangan dengan dunia. Yohanes di perikop ini juga ingin menegaskan bahwa identitas inti orang percaya adalah mengasihi.

Yohanes menekankan kembali kepada jemaat di Asia Minor, di mana ajaran yang ia berikan adalah hukum yang sudah mereka terima sejak lama (hukum Taurat, Yoh 13:34) dan pokok dari ajaran tersebut adalah kasih terhadap saudara. Ia pun mengambil kisah Kain dan Habel untuk membangun sebuah ilustrasi akan kasih antar saudara yang rusak, bagaimana kita sebagai saudara dalam Kristus (“brothers in Christ”) dan Kristus sebagai yang sulung, harus mengasihi satu sama lain. Kisah Kain dan Habel menunjukkan dunia, di mana ada kebencian dan pembunuhan, yang semuanya ini bertentangan dengan ajaran Kristus. Di perikop ini, Yohanes mendefinisikan dunia (kosmos dalam bahasa Yunani) sebagai suatu unsur dunia yang hancur, yang berlawanan dengan Allah (Yoh 17:15). Untuk itu, tidak mungkin bagi seseorang yang mengaku mengikut Kristus, tetapi tidak mengasihi, masih tinggal dalam maut (1 Yoh 3:14), dan mencintai dunia. Di sisi lain, orang percaya pasti berpindah dari dalam maut ke dalam hidup dan mengasihi saudaranya (1 Yoh 3:14).

Lalu kasih seperti apa yang dimaksud oleh Yohanes? Kasih tersebut adalah kasih sempurna Kristus (agape), yang terpancar dalam peristiwa penyaliban dan dengan itu telah menjembatani dari kematian kekal kepada kehidupan yang kekal. Kasih agape adalah kasih yang menutupi segala dosa. Kasih agape juga merupakan kasih yang praktikal (1 Yoh 3:17), yang dapat  diwujudkan juga dalam kehidupan sehari-hari lewat banyak pengorbanan seperti waktu, tenaga, emosi, uang,dll.

Lewat Matius 5:44-48, Yesus menuntut kasih yang sempurna, yang tidak hanya mengasihi orang yang mengasihi kita, bahkan hingga mengasihi musuh dan berdoa bagi mereka. Sebagai perenungan, apakah masih ada hal-hal yang berkontradiksi dalam diri kita saat ini, seperti mengaku percaya, tetapi masih ada kebencian terhadap sesama? Dan sudahkah kita benar-benar mempraktekkan kasih agape dalam kehidupan sehari-hari?$notes$, $tldr$### **TL;DR PA Besar 20.06.2026 : Kasih (1 Yohanes 3:11-18)**

PA Besar: Aldi

Dalam isi suratnya kali ini, Yohanes menekankan kembali kepada jemaat di Asia Minor, bahwa identitas inti dari pengikut Kristus adalah kasih. Sebagaimana Kristus telah mengasihi kita, dan oleh karena itu, kita harus saling mengasihi satu sama lain (Yoh 13:34) di tengah-tengah dunia yang hancur dan berlawanan dengan Allah (Yoh 17:15). Kisah Kain dan Habel menjadi satu contoh relasi yang rusak, akibat adanya kebencian yang berujung pada pembunuhan.

Lalu kasih apa yang dimaksud oleh Yohanes? Kasih tersebut adalah kasih sempurna Kristus (agape), yang terpancar dalam salib-Nya dan telah menjembatani kematian kekal ke kehidupan kekal, yang mampu menutupi segala dosa. Oleh karena itu, Yohanes pun mendorong setiap dari kita untuk mempraktekkan kasih agape yang diwujudkan dalam kehidupan sehari-hari (1 Yoh 3:14).

Sebagai perenungan, apakah masih ada hal-hal yang berkontradiksi dalam diri kita saat ini, seperti mengaku percaya, tetapi masih ada kebencian terhadap sesama? Dan sudahkah kita benar-benar mempraktekkan kasih agape dalam kehidupan sehari-hari?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-06-27', 'church_service', $notes$### **27-06-2026: Keyakinan di hadapan Allah (1 Yohanes 3:19-24)**

Ibadah Ev. Riggruben

Di tengah fenomena *expressive individualism* yang sering beredar, lewat perikop di kitab 1 Yohanes kali ini, kita belajar bagaimana kita mempunyai  keyakinan di hadapan Tuhan. Fenomena *expressive individualism* ini adalah satu fenomena di mana sering kali kita mengambil keputusan berdasarkan pada suara hati pribadi, sehingga kita sering terlalu fokus dan lebih mempercayai suara hati kita sendiri dibandingkan dengan apa yang Tuhan kehendaki dan nyatakan.

Padahal, perasaan dan suara hati kita perlu disadari keterbatasannya. Kita diingatkan bahwa identitas kita yang sejati dalam Tuhan harus melampaui suara hati sendiri, karena Allah adalah lebih besar dari pada hati kita serta mengetahui segala sesuatu (ay 20). Jika kita membiarkan suara hati tersebut menjadi lebih keras daripada suara Allah, kita justru akan kehilangan kesempatan untuk mengenal kasih serta kebesaran-Nya yang jauh lebih luas. Walaupun suara hati kita bisa bergumul dengan dosa, gambar diri, dan pengampunan pada orang lain, kita bisa tetap datang kepada Tuhan yang mengingatkan identitas kita di dalam-Nya.

Untuk kita bisa menguatkan identitas kita di dalam Tuhan, langkah yang perlu diambil adalah menenangkan diri di hadapan Allah. Hal ini dapat dilakukan melalui doa dengan pendekatan katafatik yang menggunakan kata-kata serta Firman yang telah Tuhan nyatakan, atau melalui keheningan total dalam metode apofatik tanpa kata-kata sama sekali. Dengan menyediakan ruang bagi keheningan, kita belajar untuk lebih mendengarkan suara Allah serta membiarkan Roh berdoa daripada sekadar mendengarkan ego atau nurani kita sendiri. Kedua pendekatan ini hendaknya seimbang dalam kehidupan doa kita.

Pada akhirnya, ketaatan kepada Tuhan tidak boleh berhenti pada bentuk legalisme atau sekadar menjalankan serangkaian aturan. Relasi kita dengan-Nya harus melampaui itu semua, di mana ketaatan menjadi buah dari kasih yang tulus dan relasi yang intim dengan-Nya. Di antara banyaknya perintah yang harus dijalankan sebagai orang percaya, kasihilah sesama manusia (ay 23) tetap menjadi perintah yang paling utama sebagai wujud nyata dari ketaatan kepada Tuhan. Roh Allah yang telah dikaruniakan kepada kita ini akan memampukan kita untuk bisa mengasihi sesama dan menuruti segala perintah Tuhan (ay 24).$notes$, $tldr$### **TL;DR Ibadah 27.06.2026 : Keyakinan di hadapan Tuhan (1 Yohanes 3:19-24)**

Ibadah: Ev. Riggruben

Di tengah zaman ekspresif individualisme yang membuat kita cenderung terlalu mengandalkan suara hati dalam mengambil keputusan, kita diingatkan bahwa identitas sejati kita dalam Tuhan harus melampaui suara hati kita yang tidak sempurna. Untuk kita bisa menguatkan identitas kita di dalam Tuhan, kita perlu menenangkan diri dan berdoa di hadapan-Nya, dengan cara pendekatan katafatik (berkata-kata dan berdoa menurut sesuatu yang Tuhan telah nyatakan) ataupun apofatik (keheningan total), agar kita bisa lebih mendengarkan suara Tuhan daripada keinginan diri sendiri serta membiarkan Roh yang berdoa. Kedua hal ini hendaknya seimbang!

Pada akhirnya, ketaatan bukanlah sekadar menjalankan aturan atau legalisme, melainkan buah dari kasih yang tulus dan relasi yang intim dengan-Nya, di mana mengasihi sesama sebagai wujud nyata ketaatan tertinggi. Roh yang memampukan kita untuk bisa mengasihi sesama dan menuruti segala perintah Tuhan.

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-07-04', 'bible_study', $notes$### **04-07-2026: Pengujian Roh (1 Yohanes 4:1-6)**

PA Besar Danny Kurniawan

Bagaimana kita tahu bahwa suatu pengajaran tentang Tuhan benar-benar berasal dari Allah?

Surat 1 Yohanes ditulis oleh Yohanes kepada orang percaya di Asia Minor, yang sebagian besar kalangan non-Yahudi yang percaya pada Injil. Pada masa itu mulai muncul pengaruh ajaran Proto-Gnostik, yang menjadi pemikiran awal dari Gnostik. Ajaran ini membedakan roh dan daging secara tajam dan melihat roh sebagai sesuatu yang ilahi, sedangkan daging atau dunia materi dianggap jahat.

Mereka percaya sifat keilahian Yesus, tetapi karena Allah dianggap tidak mungkin bersatu dengan daging yang jahat, mereka akhirnya menganggap tubuh Yesus hanya seperti ilusi. Dalam 1 Yohanes 1:1, Yohanes membantah dan menekankan bahwa Yesus adalah Dia yang didengar, dilihat, dan diraba oleh para saksi. Artinya, Yesus benar-benar datang sebagai manusia, bukan hanya tampak seperti manusia.

Dalam 1 Yohanes 4:1, Yohanes berkata agar orang percaya tidak langsung percaya kepada setiap roh, tetapi menguji apakah roh itu berasal dari Allah. Roh di sini bisa dipahami sebagai penggerak atau sumber yang mempengaruhi hati, pikiran, dan pengajaran seseorang. Dari perkataan dan ajaran seseorang, kita bisa melihat apakah ia digerakkan oleh Roh Allah atau oleh roh dunia.

Ada beberapa ciri-ciri Roh Allah yang Yohanes jelaskan:

1. **Roh Allah mengakui Yesus Kristus yang datang sebagai manusia.**
Dalam ayat 2, Yohanes berkata bahwa setiap roh yang mengaku bahwa Yesus Kristus telah datang sebagai manusia berasal dari Allah. Ini penting karena iman Kristen tidak hanya percaya bahwa Yesus ilahi, tetapi juga bahwa Ia sungguh-sungguh menjadi manusia.
2. **Roh Allah lebih besar daripada roh dunia.**
Dalam ayat 4, Yohanes menguatkan jemaat dengan berkata bahwa mereka berasal dari Allah dan telah mengalahkan nabi-nabi palsu. Mereka tetap memilih mengikuti Kristus, walaupun ada banyak ajaran palsu yang muncul.
3. **Roh Allah membuat orang mendengarkan kesaksian para rasul.**
Dalam ayat 6, Yohanes berkata bahwa orang yang berasal dari Allah akan mendengarkan kesaksian apostolik tentang Yesus, siapa Dia, karya-Nya, dan jalan keselamatan yang Ia berikan.

Sebaliknya, Yohanes juga menjelaskan ciri-ciri roh antikristus:

1. **Roh antikristus tidak mengakui Yesus dengan benar.**
Dalam ayat 3, roh yang tidak mengakui Yesus berasal dari antikristus. Ini bukan hanya soal menolak nama Yesus, tetapi juga menolak kebenaran tentang siapa Yesus: kehadiran-Nya, kemanusiaan-Nya, keilahian-Nya, dan ajaran-Nya.
2. **Roh antikristus berasal dari dunia.**
Ayat 5 berkata bahwa mereka berasal dari dunia, maka mereka berbicara tentang hal-hal duniawi dan dunia mendengarkan mereka. Dalam Perjanjian Baru, “dunia” sering menggambarkan orang-orang yang tidak mengenal Allah, hidup bertentangan dengan kehendak-Nya, dan mengikuti kehendak daging, seperti yang juga digambarkan dalam Galatia 5:19–21.
3. **Roh antikristus tidak mendengarkan ajaran para rasul**
Dalam ayat 6, Yohanes menunjukkan bahwa mereka yang tidak berasal dari Allah tidak akan menerima pengajaran yang benar dan kebenaran yang disampaikan para saksi Kristus.

Dari bagian ini, kita diajak untuk lebih peka dan menguji setiap pengajaran: apakah ia mengakui Yesus dengan benar, sesuai dengan kesaksian Firman Tuhan, dan menghasilkan hidup yang taat kepada Allah? Kita perlu berjaga-jaga dan dipanggil untuk tetap tinggal dalam kebenaran, mendengarkan Firman Tuhan, dan mengikuti Kristus dengan setia.$notes$, $tldr$### **TL;DR PA Besar 04.07.2026 : Pengujian Roh (1 Yohanes 4:1-6)**

PA Besar: Danny Kurniawan

Yohanes di perikop ini meminta kita untuk menguji setiap pengajaran: apakah pengajaran itu benar berasal dari Allah, sesuai dengan Firman Tuhan, dan mengakui Yesus Kristus dengan benar.

Pada masa itu, muncul pengaruh ajaran Proto-Gnostik yang menolak bahwa Yesus sungguh datang sebagai manusia. Karena itu, Yohanes menegaskan bahwa Roh yang berasal dari Allah akan mengakui Yesus yang sungguh datang dalam daging, mendengarkan kesaksian para rasul, dan membawa orang hidup dalam kebenaran. Sebaliknya, roh antikristus menolak kebenaran tentang Yesus dan membawa manusia mengikuti roh dunia.

Apakah kita sudah menguji pengajaran yang kita dengar dengan Firman Tuhan? Apakah hidup kita lebih mudah dipengaruhi oleh kebenaran Kristus atau oleh suara dunia?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-07-11', 'church_service', $notes$### **11-07-2026 Logika Kasih Allah: Kesempurnaan Cinta (1 Yohanes 4 : 7-21)**

Ibadah: Ev. Riggruben

Cinta adalah aspek fundamental bagi kehidupan manusia, namun seringkali kasih manusia terbatas dan gagal mencapai tujuan yang seharusnya. Pergumulan ini juga dialami oleh jemaat di Efesus. Akibat masuknya ajaran-ajaran yang menyimpang, terjadi perpecahan di tengah jemaat yang membuat mereka saling membenci dan melupakan identitas utama mereka tentang kasih Allah. Melalui suratnya, Rasul Yohanes mengingatkan kembali bahwa ajaran yang benar akan selalu terlihat dari buah perbuatannya, dan unsur yang paling utama dari buah tersebut adalah kasih Allah.

1. Mengalami Allah, Sang Sumber Kasih

Kekristenan berakar pada kasih, sebab Allah sendiri adalah sumber kasih. Firman Tuhan menyatakan bahwa Allah adalah kasih, meskipun ini tidak sepenuhnya berarti bahwa kasih itu sendiri adalah Allah karena manusia seringkali mendefinisikan kasih Allah menurut kacamata manusia yang terbatas. Oleh karena itu, standar cinta sejati bukan sekadar moralitas atau sentimen belaka, melainkan eksklusif bersumber dari karakter Tuhan. Kasih merupakan natur Allah yang telah ada sejak semula dalam relasi Allah Tritunggal (Kej. 1).

Kasih Allah ditunjukkan secara nyata melalui inkarnasi dan pengorbanan Yesus Kristus. Yesus tidak datang sekadar menjadi manusia biasa, melainkan untuk mendamaikan umat manusia yang berdosa agar beroleh keselamatan, dan tidak lagi hidup dalam ketakutan akan kematian maupun penghakiman.

Melalui Roh Kudus, Tuhan mengundang kita untuk hidup dalam persekutuan yang intim dengan-Nya (ay. 13–16). Kita dimampukan mengalami bahwa Allah tinggal di dalam kita dan kita di dalam Dia (*mutual indwelling*), serta percaya kepada karya Kristus sebagai dasar kehidupan kita.

Ketika kita jatuh atau mengecewakan Tuhan, kita sering meragukan apakah kita masih layak dikasihi. Namun, Allah mengasihi kita dengan *agape*, yaitu kasih yang tanpa syarat. Kita mungkin meninggalkan Tuhan, tetapi Dia tidak pernah meninggalkan kita (Roma 8:35–39).

1. Mengasihi Sesama sebagai Orang yang Dikasihi dan Mengasihi Allah

Setelah mengalami kasih Allah, kita dipanggil untuk mengasihi sesama sebagai bukti bahwa kita hidup di dalam kasih-Nya. Kasih sejati bukanlah sesuatu yang pasif. Ada sebuah ungkapan yang mengatakan bahwa kasih tidak dapat dipahami hanya dengan dipelajari, tetapi baru benar-benar dimengerti ketika dipraktikkan.

Kita dipanggil untuk terus mengasihi sesuai perintah Kristus (Yohanes 13:34–35). Inilah yang dimaksud dengan *perfected love*, yaitu kasih yang mencapai tujuannya ketika terus-menerus diwujudkan dan disempurnakan dalam kehidupan sehari-hari. Jika kita mengaku mengasihi Allah tetapi masih menyimpan kebencian kepada sesama, maka kasih itu belum sungguh-sungguh hidup dalam diri kita.

Dalam mempraktikkan kasih, ada beberapa tantangan yang perlu dihadapi. Pertama, kasih harus dilakukan secara intensional. Kita tidak hanya mengasihi orang yang mudah dikasihi, tetapi belajar taat mengasihi sebagaimana Kristus telah mengasihi kita. Kedua, kita perlu memperhatikan kesehatan emosional karena kedewasaan emosional dan kedewasaan rohani berjalan beriringan. Luka-luka masa lalu seringkali menghambat kita untuk mengasihi. Karena itu, kita membutuhkan komunitas yang sehat untuk dipulihkan, belajar berempati, dan merestorasi  hal-hal yang Tuhan ingin ubahkan dalam hidup kita. Pada akhirnya, kasih selalu diwujudkan melalui pelayanan. Mengasihi berarti bersedia melayani, dan melayani selalu menuntut pengorbanan.

Karena itu, marilah kita bertanya kepada diri sendiri: sudahkah kita sungguh-sungguh tenggelam dalam kasih Kristus? Ataukah kita masih berdiri di tepi kolam, ragu untuk menyerahkan seluruh hidup kepada-Nya? Kiranya kita mau membuka hati, tinggal di dalam kasih-Nya, dan membiarkan Dia terus mengubahkan hidup kita, sehingga kita pun mampu mengasihi sesama sebagaimana Kristus telah mengasihi kita.$notes$, $tldr$### **TL;DR Ibadah 11.07.2026 : Logika Kasih Allah: Kesempurnaan Cinta (1 Yohanes 4 : 7-21)**

Ibadah: Ev. Riggruben

Kasih merupakan dasar kehidupan orang percaya karena Allah sendiri adalah sumber kasih. Melalui inkarnasi dan pengorbanan Yesus Kristus, Allah menyatakan kasih-Nya dengan menyelamatkan manusia dari dosa. Karena itu, Tuhan mengundang kita untuk tinggal di dalam kasih-Nya, hidup dalam persekutuan dengan-Nya, dan percaya sepenuhnya kepada karya Kristus.

Setelah mengalami kasih Allah, kita dipanggil untuk mengasihi sesama. Kasih bukan sekadar perasaan atau teori, tetapi harus diwujudkan dalam tindakan. Kasih yang sejati akan terus mengalir kepada orang lain, bahkan ketika hal itu menuntut pengorbanan, pengampunan, dan kerelaan untuk melayani. Karena itu, kita perlu belajar mengasihi secara intensional, bertumbuh dalam komunitas yang sehat, dan membiarkan Tuhan memulihkan hati kita agar mampu mengasihi seperti Kristus.

Sudahkah kita sungguh-sungguh tinggal di dalam kasih-Nya, dan membiarkan kasih itu mengubah hidup kita? Kiranya melalui hidup yang dipenuhi kasih Allah, kita dapat menjadi saluran kasih-Nya bagi sesama.

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-07-18', 'bible_study', $notes$### **18-07-2026 Iman mengalahkan dunia (1 Yohanes 5 : 1-5)**

PA Besar: Billy

Surat 1 Yohanes ditujukan kepada kalangan orang percaya yang tinggal di daerah Asia Minor, di mana banyak kaum intelektual dan filsuf bermunculan, sehingga banyak konsep kekristenan yang akhirnya dicampur dengan paham-paham filosofi. Ini juga menjadi salah satu sumber perpecahan dalam jemaat karena banyaknya perbedaan paham yang beredar. Salah satu paham yang muncul adalah Proto-Gnostik, yang akhirnya menjadi Gnostik. Paham ini memisahkan daging, yang dianggap jahat, dengan roh, yang dianggap baik, sehingga memunculkan problema etik dan perbuatan. Salah satu problema tersebut adalah paham bahwa orang yang sudah mengenal Allah masih boleh melakukan perbuatan daging (dosa) karena roh mereka terpisah dengan kedagingan mereka. Yohanes dengan jelas mengatakan bahwa setiap orang yang sudah berada dalam Kristus tidak berbuat dosa lagi (1 Yohanes 3:6), dalam arti tidak menjadikan dosa sebagai kebiasaan.

Dalam perikop ini, dua indikator utama orang yang benar-benar percaya adalah mereka yang memiliki iman dan kepercayaan yang benar pada Yesus Kristus dan mengasihi saudaranya dalam Kristus.

Apa artinya memiliki iman dan kepercayaan yang benar pada Yesus Kristus?

- Kata percaya (ay 1) sendiri dalam bahasa aslinya *pisteuōn* memiliki penekanan bahwa aksi ini aktif dan dilakukan secara terus-menerus.
- Mereka telah mengalami lahir baru, sehingga disebut lahir dari Allah (ay 2) atau dalam Roh. Melalui peristiwa ini, mereka diberikan hati dan Roh yang baru sehingga mampu mengasihi Allah serta sesamanya.
- Mereka akan melakukan perintah-perintah Allah (ay 2).

- Kata melakukan (ay 2) sendiri dalam bahasa Yunani *poiōmen* berarti (engl. keep practice), yang artinya kita juga benar-benar mempraktikkan dan mengerjakan perintah-Nya secara konstan.
- Perintah Allah itu sendiri mencakup kepercayaan bahwa Yesus Kristus adalah anak Allah yang lahir dalam daging, dan praktik saling mengasihi sesuai dengan perintah Yesus (1 Yoh 3:23). Orang yang percaya pada-Nya **pasti** mengasihi saudara-saudaranya dalam Kristus (ay 1).
- Di sisi lain, Yohanes mengatakan bahwa perintah-perintah-Nya tidaklah berat karena Allah telah mengalahkan dunia (ay 3 & 4). Dunia disini berarti satu sistem yang iblis bangun yang bertolak belakang dengan Allah, yang senantiasa mempraktikkan keinginan daging, mata serta keangkuhan hidup (1 Yoh 2:16). Artinya, iman kita pada Allah mengubahkan natur kita untuk bisa melawan kedagingan kita dan mengasihi Allah.

Apa artinya mengasihi saudaranya?

- Akar kata mengasihi sendiri di sini dalam bahasa Yunani adalah *agape* yang artinya kasih yang tulus dan tanpa syarat, seperti bagaimana Allah mengasihi. Tuntutan kita sebagai orang percaya adalah melakukan *agape* terhadap sesama.

Sebagai aplikasi, renungkanlah, apakah kita sungguh-sungguh telah lahir baru? Apakah kita telah memiliki iman percaya yang benar pada Yesus Kristus? Apabila ya, apakah kita senantiasa mengasihi sesama kita?$notes$, $tldr$### **TL;DR PA Besar 18.07.2026 : Iman mengalahkan dunia (1 Yohanes 5 : 1-5)**

PA Besar: Billy

Dalam perikop ini, dua indikator utama orang yang benar-benar percaya adalah mereka yang memiliki iman dan kepercayaan yang benar pada Yesus Kristus sertamengasihi saudaranya dalam Kristus.

Apa artinya memiliki iman dan kepercayaan yang benar pada Yesus Kristus? Mereka yang senantiasa percaya secara aktif (ay 1) kepada Tuhan, telah mengalami lahir baru, dan melakukan perintah-perintah-Nya (ay 2). Perintah-perintahNya yaitu percaya bahwa Yesus Kristus adalah anak Allah yang lahir dalam daging, dan praktik saling mengasihi sesuai dengan perintah Yesus (1 Yoh 3:23). Yohanes mengatakan bahwa perintah-perintah-Nya tidaklah berat karena Allah telah mengalahkan dunia (ay 3 & 4). Artinya, iman kita pada Allah pada dasarnya mengubahkan natur kita untuk bisa menang melawan kedagingan kita dan mengasihi Allah.

Apa artinya mengasihi saudaranya? Orang yang beriman kepada Yesus Kristus mengasihi saudara-saudaranya (ay 1 & 2) dengan kasih agape, kasih yang tulus dan tanpa syarat.

Apakah kita telah memiliki iman percaya yang benar pada Yesus Kristus? Apabila ya, apakah kita senantiasa mengasihi sesama kita?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-07-25', 'church_service', $notes$### **25-07-2026 Kesaksian tentang Anak Allah (1 Yohanes 5 : 6-12)**

Ibadah : Ev. Riggruben

Apa alasan seorang menjadi orang Kristen? Ada 4 kemungkinan alasan:

1. Sociological Reasons:        atas dasar pengaruh lingkungan, seperti keluarga, teman, dll.
2. Psychological Reasons:        membawa kedamaian / hal-hal yang mempengaruhi psikis seseorang.
3. Religious Reasons:        pengalaman religius seperti mukjizat / kuasa hebat Tuhan.
4. Philosophical Reasons:        logis, filosofis, konsistensi, koherensi, kontradiktif atau tidak, dan pemahaman secara rasio.

Dalam surat 1 Yohanes, inti yang ingin disampaikan oleh Yohanes adalah supaya kita mengenal dan diteguhkan bahwa Yesus itu Anak Allah. Di dalam pasal 5, bersaksi menjadi tema penting karena di sini Yohanes bersaksi tentang siapa itu Anak Allah. Bersaksi di sini juga dapat diartikan “yang menyatakan kebenaran bahwa Yesus adalah benar Anak Allah yang jadi manusia”. Dalam kesaksian Yohanes ada beberapa poin penting, yaitu :

1. Perumpamaan Air dan Darah (Ay. 6-8)

Apa itu air dan darah? Ada berbagai pendapat tentang statement ini seperti  Sakramen Baptisan dan Perjamuan Kudus, kematian Yesus di kayu salib. Akan tetapi, air dan darah ini sebenarnya mengacu pada baptisan Yesus yang dilambangkan oleh air dan darah yang melambangkan kematian Yesus yang menanggung semua dosa kita. Keduanya membingkai pelayan Yesus sebagai manusia. Pada saat itu juga bermunculan beberapa ajaran sesat seperti Gnostik yang beranggapan bahwa Yesus tidak pernah menjadi manusia. Tetapi kenyataannya Yesus tetap adalah manusia sampai kematian-Nya di kayu salib.

1. Roh Kebenaran (Ay. 6-8)

Roh Kudus bersaksi kepada orang percaya bahwa Yesus adalah kebenaran dan jalan yang hidup (Yoh. 15:26, Yoh. 16:13). Apa yang dimaksud dengan percaya kepada Yesus? Percaya akan kebenaran Yesus meliputi:

1.        Pengetahuan dan keyakinan terhadap siapa Yesus dalam sejarah yang benar ada dalam kemanusiaannya dan sebagai Allah yang berinkarnasi.

2.        Adanya kesaksian internal Roh Kudus yang membuat hati kita tunduk pada kebenaran ini dan sadar akan butuhnya anugerah keselamatan.

Kedua hal ini harus berjalan bersama. Pengetahuan tanpa hati yang tunduk kepada Kristus dapat membuat seseorang merasa cukup dengan pengetahuannya, tetapi belum sungguh menyadari kebutuhannya akan anugerah keselamatan.

3.        Allah yang bersaksi (Ay. 9-12)

Allah Bapa sendiri bersaksi tentang Yesus sendiri (Yoh. 5:37) dan kesaksian-Nya lebih kuat dari kesaksian manusia (ay 9). Jika kita percaya pada Allah kita harus mendengar kesaksian-Nya, yaitu Anak Allah adalah Kristus itu sendiri. Sentralitas kekristenan adalah Kristus yang pernah datang menjadi manusia untuk menebus dosa kita. Dalam kekristenan hanya ada 1 mediator yang sejati yaitu Kristus itu sendiri. Kita akan memperoleh hidup yang kekal yang ada di dalam-Nya (ay 11). Apa itu hidup yang kekal? Hidup kekal dimulai ketika kita mengenal-Nya.

Secara kultural, orang Yahudi membedakan 2 zaman:

1.        Zaman Sekarang yang dipenuhi dosa dan penderitaan tetapi memiliki pengharapan terakhir akan dimensi baru.

2.        Zaman yang akan datang : Ketika Allah memerintah sepenuhnya dan memulihkan ciptaan.

Hidup yang kekal itu bukan di masa depan,  nyatanya hidup yang kekal sudah diberikan oleh Kristus yaitu dengan adanya relasi dengan Allah melalui Kristus karena kita percaya pada-Nya. Oleh karena itu ada suatu kepenuhan hidup yang bisa kita cicipi dalam Kristus.

Sudahkah kita di dalam hidup ini mengenal siapa Anak Allah itu? Apakah kita sudah mengalami hidup yang kekal?$notes$, $tldr$### **TL;DR Ibadah 25.07.2026 : Kesaksian tentang Anak Allah (1 Yohanes 5 : 6-12)**

IBADAH : Ev. Riggruben

Dalam perikop ini, ada 3 poin yang ingin disampaikan oleh Yohanes agar orang percaya diteguhkan dan mengenal siapa itu Anak Allah, apa itu kesaksian Roh dan kebenaran, dan kesaksian Allah tentang Yesus.

1. **Siapa itu Anak Allah?:** Yesus Kristus itu sendiri yang turun ke bumi menjadi manusia, dibaptis, mati di atas kayu salib untuk menanggung dan menebus semua dosa kita.
2. **Kesaksian Roh dan Kebenaran:** Roh bersaksi kepada orang percaya supaya kita percaya pada Yesus dan kebenarannya. Percaya pada-Nya meliputi memiliki pengetahuan dan keyakinan terhadap siapa itu Yesus yang datang ke dunia berinkarnasi sebagai manusia dan sadar bahwa adanya kebutuhan dalam hidup akan anugerah keselamatan yang telah dijanjikan-Nya.
3. **Allah yang bersaksi:** Kesaksian yang Ia lakukan sendiri itu lebih kuat dan kita sebagai orang percaya harus mendengar kesaksian-Nya yaitu Kristus Yesus adalah Anak Allah. Kita yang sudah percaya pada-Nya dan mengenal-Nya akan  memperoleh hidup yang kekal.

Sudahkah kita di dalam hidup ini mengenal siapa Anak Allah itu? Apakah kita sudah mengalami hidup yang kekal?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-08-01', 'bible_study', $notes$### **01-08-2026: Assurance of Salvation (1 Yohanes 5:13-21)**

PA Besar Aldi

Surat 1 Yohanes ditulis kepada jemaat yang sedang menghadapi berbagai ajaran yang membingungkan. Ada kelompok-kelompok yang mengajarkan bahwa Injil saja tidak cukup dan manusia membutuhkan suatu “pengetahuan khusus” untuk memperoleh keselamatan. Akibatnya, muncul pertanyaan: Apa yang harus dipercayai? Dan bagaimana seseorang tahu bahwa ia sudah memiliki hidup yang kekal? Karena itu, Yohanes kembali kepada berita yang sudah mereka terima sejak semula: keselamatan ada di dalam Yesus Kristus.

1. Keyakinan akan Kehidupan Kekal (ay. 13)

Tujuan Yohanes bukan membuat orang percaya hidup dalam ketidakpastian, melainkan memberikan *assurance* atau kepastian keselamatan. Barangsiapa memiliki Anak, ia memiliki hidup (lih. 1 Yoh 5:11-12). Keselamatan tidak bergantung pada pengetahuan rahasia, kemampuan rohani kita, atau sesuatu yang harus ditambahkan kepada Injil melainkan keyakinan akan Kristus dan karya-Nya.

Karena itu pertanyaannya bukan hanya, *“Apakah aku merasa diselamatkan?”* tetapi, “Apakah aku percaya kepada Anak Allah sebagaimana Ia menyatakan diri-Nya?”

2. Fungsi Berdoa (ay. 14-17)

Karena kita mengenal Kristus, kita juga mempunyai keberanian datang kepada Allah. Yesus telah membuka jalan sehingga orang percaya dapat datang kepada Bapa melalui Dia (Yoh. 16:24). Yohanes menekankan: kita berdoa menurut kehendak-Nya.

Salah satu contoh yang langsung diberikan Yohanes adalah mendoakan saudara seiman yang sedang jatuh dalam dosa.

Jika kita melihat seorang saudara melakukan dosa yang tidak mendatangkan maut, kita berdoa supaya Tuhan menolongnya, memberikan pertobatan, memulihkan, dan membawanya kembali hidup dalam ketaatan.

Sedangkan mengenai “dosa yang mendatangkan maut”, Yohanes tampaknya menunjuk kepada keadaan yang jauh lebih serius daripada sekadar orang percaya yang masih bergumul dan jatuh dalam dosa: suatu penolakan terhadap Kristus yang dilakukan dengan sadar, terus-menerus, dan tanpa pertobatan.

Jadi fokus Yohanes bukan membuat kita sibuk menentukan dosa siapa yang “terlalu berat”, melainkan mengingatkan: jangan berhenti mendoakan saudara kita yang masih bergumul dengan dosa dan masih membutuhkan pemulihan dari Tuhan.

3. Iman dan pengenalan akan anak Allah (ay.18-21)

Yohanes mengatakan bahwa orang yang sudah percaya tidak berbuat dosa lagi. Maksudnya di sini adalah orang yang lahir dari Allah tidak terus-menerus menjadikan dosa sebagai cara hidupnya. Orang percaya memang masih dapat jatuh, tetapi ada pertobatan, pengakuan dosa, keinginan untuk menaati Tuhan, dan proses untuk semakin hidup dalam kekudusan.

Dalam proses itu kita tidak berjalan sendirian: Kristus memelihara umat-Nya, dan si jahat tidak dapat merebut mereka dari tangan-Nya. Kemudian di tengah banyaknya ajaran yang mengatakan bahwa manusia membutuhkan “pengetahuan yang lebih tinggi”, Yohanes kembali mengingatkan bahwa pengenalan kita kepada Allah bukan hasil kehebatan intelektual atau kemampuan kita menemukan suatu rahasia rohani. Allah sendiri yang menyatakan diri-Nya melalui Anak-Nya, Yesus Kristus.

Kristus telah sungguh-sungguh datang ke dunia, dalam tubuh yang nyata, dan melalui karya-Nya Ia menyatakan siapa Allah itu. Kepastian keselamatan kita tidak terletak pada seberapa banyak yang kita tahu, seberapa sempurna hidup kita, atau seberapa kuat perasaan iman kita. Kepastian kita ada pada Yesus Kristus. Dia telah datang ke dunia, mati dan bangkit, dan Allah sendiri memberikan kesaksian mengenai Anak-Nya. Barangsiapa percaya kepada Anak memiliki hidup yang kekal.$notes$, $tldr$### **TL;DR PA Besar 01.08.2026 : Assurance of Salvation (1 Yohanes 5:13-21)**

PA Besar Aldi

Apakah kita benar-benar dapat yakin bahwa kita memiliki keselamatan di dalam Tuhan Yesus? Yohanes menegaskan bahwa kita dapat tahu bahwa kita memiliki hidup yang kekal ketika kita percaya kepada Anak Allah. Kepastian keselamatan kita berasal dari kepercayaan pada Kristus dan karya-Nya.

Karena kita sudah menjadi milik-Nya, kita juga memiliki keberanian untuk datang kepada Allah dalam doa. Kita dipanggil untuk mendoakan saudara seiman yang sedang jatuh dan bergumul dalam dosa, agar Tuhan menolong dan memulihkannya. Orang percaya memang masih dapat jatuh dalam dosa, tetapi ada pertobatan dan kerinduan untuk kembali hidup dalam ketaatan kepada Tuhan.

Pada akhirnya, Yohanes mengingatkan bahwa pengenalan kita akan Allah pun adalah pemberian-Nya melalui Yesus Kristus. Di dalam Kristus, kita dapat yakin bahwa kita memiliki hidup yang kekal.

Apakah kepastian keselamatan kita selama ini benar-benar berakar pada Kristus? Dan ketika melihat saudara seiman jatuh dalam dosa, apakah kita sudah membawanya di dalam doa?

Selamat mengawali minggu yang baru untuk teman-teman Perki Aachen 👋 God bless!$tldr$),
  ('2026-08-08', 'church_service', $notes$### **08-08-2026 When Truth Changes How You Live (2 Yohanes)**

Ibadah : Ev. Riggruben

Di surat Yohanes yang kedua, Yohanes berfokus tentang kebenaran. Para jemaat pada kala itu sedang mengalami pergumulan melawan orang-orang yang menyebarkan ajaran sesat yang tidak sesuai dengan Injil.

Yohanes membuka surat dengan kata pengantar (ay. 1-4). Di pengantar ini, ia menulis kepada Ibu dan anak-anaknya. Para penafsir melihat hal ini sebagai kata-kata metaforikal untuk gereja. Kita juga bisa melihat dari ayat 4 bahwa Yohanes mempunyai *concern* untuk para jemaat mengenai tema kebenaran dan kasih. Pengenalan Yohanes akan kebenaran menjadi motivasi pelayanan Yohanes. Ia bersukacita saat ada jemaat yang hidup dalam kebenaran dan berharap agar jemaat tidak terpengaruh oleh ajaran sesat.

Kini kita masuk ke dalam isi utama dari surat 2 Yohanes ini (ay. 5-11). Pertama, Yohanes ingin berbicara mengenai kebenaran dan kasih. Di tengah pergumulan pengaruh ajaran sesat, Yohanes menekankan para jemaat untuk memprioritaskan kebenaran, yaitu Injil. Adanya ajaran sesat ini berpotensi untuk menyebabkan perpecahan gereja dan mengasihi satu sama lain pun menjadi pergumulan.

Yohanes selalu mengaitkan kebenaran dengan kasih. Kedua hal ini merupakan kepribadian Allah yang tidak bisa dipisahkan. Dalam konteks kehidupan bergereja kita pada zaman sekarang, kita harus bisa menghindari pendekatan gereja ke jemaatnya yang simplistik dan partial, yang memisahkan kasih dan kebenaran. Terkadang kita menyebarkan kebenaran, tapi lupa untuk mengasihi lawan bicara kita (seperti ingin menang berdebat), atau sebaliknya, kita terlalu fokus terhadap kasih tanpa membagikan kebenaran (misalnya melainkan injil, kita hanya membagikan *self-help*).

Isi kedua dari surat ini adalah tentang batas keramahan / *boundaries on hospitality*. Di tengah penyebaran ajaran sesat pada kala itu, budaya *hospitality* malah menjadi perangkap yang dimanfaatkan oleh para pengajar palsu untuk menyebarkan ajaran mereka saat mereka menginap di rumah orang percaya. Karena itu, rasul Yohanes bahkan melarang para jemaat agar tidak membuka pintu rumah atau bahkan memberi salam kepada para pengajar sesat serta mengingatkan jemaat agar tidak naif.

Bagi kehidupan kita pada saat ini, kita juga perlu menjaga jarak kepada para pengajar palsu atau para *heretics*. Kita perlu mengenal ajaran sesat dan tentunya perlu tahu kebenaran itu sendiri. Tanpa menjadi eksklusif, kita juga perlu mengenal batasan di mana kita tidak masuk terlalu dalam ke ajaran sesat. Terakhir, kita perlu terus bersandar pada Roh Kudus yang menjadi penyempurna iman kita, agar kita tidak terbawa dalam pengajaran sesat.

Dari surat ini, mari kita belajar dari Yohanes dan merenungkan, apa sebenarnya kebenaran bagi kita? Apakah hidup kita diubahkan saat kita tahu kebenaran tersebut? Bagaimana kita dapat menghargai kebenaran di dalam kehidupan kita?$notes$, $tldr$### **TL;DR Ibadah 08.08.2026 : When Truth Changes How You Live (2 Yohanes)**

IBADAH : Ev. Riggruben

Di surat Yohanes yang kedua, Yohanes berfokus tentang kebenaran dan kasih. Para jemaat pada kala itu sedang mengalami pergumulan melawan ajaran sesat dan perpecahan dalam gereja. Oleh sebab itu, Yohanes ingin agar para jemaat tetap berpusat pada kebenaran yaitu Injil dan agar mereka mengasihi satu sama lain.

Kasih dan kebenaran merupakan dua hal yang tidak dapat dipisahkan dalam pribadi Allah. Oleh sebab itu, kita harus menghindari pendekatan gereja ke jemaatnya yang simplistik dan partial, yang memisahkan kasih dan kebenaran. Kita tidak bisa menyebarkan kebenaran tanpa kasih (yang menjadi terlihat hanya ingin berdebat) maupun kasih tanpa kebenaran (yang menjadi *self-help* dan bukan Injil).

Yohanes juga mengingatkan jemaat untuk menjaga jarak terhadap para *heretics*. Pada zaman itu, budaya *hospitality* menjadi perangkap yang dimanfaatkan oleh para pengajar palsu untuk menyebabkan ajaran mereka saat mereka menginap di rumah orang percaya. Pada zaman sekarang, kita sebagai orang percaya perlu mengenal ajaran sesat yang beredar, tanpa menjadi eksklusif mengenal batasan dengan ajaran yang lain, dan akhirnya bersandar pada Roh Kudus yang menjadi penyempurna iman kita.

Mari kita belajar dari Yohanes dan merenungkan, apa sebenarnya kebenaran bagi kita? Apakah hidup kita diubahkan saat kita tahu kebenaran tersebut? Bagaimana kita dapat menghargai kebenaran di dalam kehidupan kita?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-08-15', 'bible_study', $notes$### **15-08-2026 Hidup dalam Kasih dan Kebenaran (3 Yohanes)**

PA Besar : Reggy

Rasul Yohanes, yang kemungkinan juga merupakan penatua gereja (lihat juga 2 Yohanes), menulis kembali surat lain.  Audiens surat ini adalah Gayus, seorang saudara yang Yohanes kasihi dalam kebenaran (ay. 1). Gayus hidup dalam kebenaran dan mempraktikkan kasih (bahasa asli: *agape*), kedua hal yang Yohanes juga tekankan di surat sebelumnya (2 Yohanes). Saat ada “orang-orang asing” yang datang ke rumahnya, yaitu para misionaris/pekerja kristen yang tidak membawa/memiliki apa-apa, Gayus menerima, melayani dan membantu mereka. Tindakan ini mendapat pujian dari Tuhan Yesus, yang berkata bahwa orang-orang yang melakukan hal tersebut “tidak akan kehilangan upahnya” (Mat. 10:40-42)! Karena itu, Yohanes juga menghimbau supaya kita, sebagai orang yang telah mendengar dan menerima Injil, juga turut berpartisipasi dalam pekerjaan Injil dengan berbagai cara yang bisa kita lakukan (misal “menerima” para pekerja ke dalam rumah kita, ay. 8).

Yohanes juga menulis surat ini karena ada masalah di dalam gereja. Diotrefes, yang tampaknya mempunyai sebuah otoritas tertentu dalam gereja, menentang otoritas Yohanes dan menolak untuk menerima saudara-saudara yang datang (ay. 9). Ia mementingkan diri sendiri dan berusaha menjauhkan para jemaat dari rasul Yohanes (dan rekan-rekannya), dengan cara memfitnah mereka. Sifat-sifat Diotrefes sesuai dengan ciri-ciri guru-guru palsu yang Paulus peringatkan (Rom. 16:17-18). Di sisi lain, di akhir suratnya rasul Yohanes juga menyebutkan Demetrius, seorang saudara yang mendapat kesaksian baik bahkan dari kebenaran itu sendiri (ay.12). Dengan semua hal ini, Yohanes ingin mengajak jemaat untuk meniru yang baik (Gayus & Demetrius) dan tidak meniru yang jahat (Diotrefes). Mereka yang berbuat baik datang dari Tuhan dan mereka yang berbuat jahat tidak mengenal Tuhan (ay. 11)!

Apa yang bisa kita pelajari dari surat Yohanes ini? Kita belajar pertama-tama tentang kasih. Pertama, kasih harus menyertai kebenaran, keduanya tidak bisa dipisahkan. Artinya, setiap kebenaran yang kita pegang teguh hendaknya juga mendorong kita untuk hidup dalam kasih (seperti Gayus). Kasih yang sejati juga akan mendapat suatu kesaksian baik dari mereka yang menerimanya. Saat kita mengasihi sesama kita dengan kasih yang murni & tulus, mereka akan bisa merasakan kasih tersebut (seperti contoh Gayus, ay. 3,6)! Kasih ini juga hendaknya mendorong kita untuk berpartisipasi dalam pemberitaan Injil, yaitu “pekerjaan untuk kebenaran” (ay. 8). Kalaupun kita tidak terpanggil untuk melayani di garis depan sebagai misionaris, masih banyak hal lain yang bisa kita lakukan dengan apa yang kita punya, baik itu doa, dana ataupun tenaga. Kita perlu mengingat, bahwa pemberitaan Injil adalah tugas semua orang percaya, bukan hanya para pendeta & misionaris. Kiranya kita semua tidak hanya mementingkan diri sendiri seperti Diotrefes, tapi bersama saudara-saudari merendahkan hati dan mempraktikkan hidup dalam kasih (Filipi 2:1-11)!$notes$, $tldr$### **TL;DR PA Besar 15.08.2026 : Hidup dalam Kasih dan Kebenaran (3 Yohanes)**

PA Besar : Reggy

Di suratnya yang berikutnya, Rasul Yohanes menulis kepada Gayus, saudara seiman yang ia kasihi dalam kebenaran. Pertama-tama Yohanes memuji Gayus karena ia terus hidup dalam kebenaran dan juga kasih. Gayus menunjukkan kasih (agape)  dengan menerima dan melayani pekerja-pekerja Kristen yang datang ke rumahnya serta turut berpartisipasi dalam pemberitaan Injil!

Selain Gayus, Rasul Yohanes juga menyebutkan Demetrius, yang mendapat kesaksian baik dari para jemaat. Namun, seakan sebagai kontras, disebutkan juga Diotrefes, yang menentang otoritas Yohanes dan hanya mementingkan diri sendiri. Ia berusaha memegang kontrol atas jemaat, tidak menyambut saudara-saudara yang datang (seperti Gayus) untuk mempertahankan otoritasnya. Yohanes menginstruksikan jemaat untuk meniru yang baik, bukan yang jahat (seperti Diotrefes)!

Dari surat ini kita belajar dari contoh Gayus, bahwa kasih dan kebenaran tidak terpisahkan! Kebenaran yang dipegang harus menghasilkan kasih, dan kasih yang sejati juga akan menghasilkan kesaksian: Orang-orang sekitar kita akan merasakan kasih kita! Kasih yang sejati juga akan berpartisipasi dalam pemberitaan Injil. Apakah kita sudah turut mendukung pemberitaan Injil Allah, baik dalam doa, dana ataupun tenaga? Marilah kita hidup dalam kasih yang sejati!

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-08-22', 'church_service', $notes$### **22-08-2026 Di dalam Kristus (Efesus 1:1-14)**

Ibadah: Sdr.SJT

Efesus adalah sebuah kota metropolitan dan religius, di mana banyak pemikiran baru muncul di sana. Salah satunya adalah pemikiran bahwa dewa adalah faktor terpenting dari kehidupan mereka, terutama dewi Artemis yang mereka sembah (Kis 19:28). Di Efesus sendiri tidak ada permasalahan spesifik di antara para jemaat, sehingga Paulus pun menulis untuk menguatkan para jemaat yang adalah kaum minoritas serta kemungkinan besar pada waktu itu dikucilkan, memperingatkan mereka akan keselamatan di dalam Kristus Yesus dan  berkat rohani yang diterima oleh anak-anak-Nya.

Election and Adoption (ay 4-6) & Redemption and Cosmic Purpose (ay 7-10)

Konsep Election and Adoption ini tidak hanya sekedar suatu konsep datar, melainkan adanya alur kasih karunia yang terjadi, di mana pertama Allah dalam Kristus memilih dan menjadikan umat manusia sebagai anak-anak-Nya dengan kerelaan dan kehendak-Nya, bukan karena apa yang kita perbuat. Karena keadilan-Nya juga Tuhan tidak bisa begitu saja menyelamatkan umat manusia dan menghapus dosa, sehingga harus ada upah yang dibayarkan dan oleh karena darahNya kita ditebus (ayat 7). Oleh karena itu, pemilihan pun bukan alasan untuk meninggikan diri, tetapi menjadi proses untuk membawa kepada kekudusan, adopsi, dan penyembahan.

Inheritance, Hope, Glory  (ay 11-12) & Kamu juga, di dalam Dia (ay 13-14)

Paulus ingin menekankan bagaimana banyaknya janji yang didapatkan dalam Kristus, serta bagaimana Allah memegang segala aspek dalam tangan-Nya dan tidak adapun sejarah yang terlepas dari kehendak-Nya. Ia tidak hanya menjelaskan apa yang akan kita dapat, tetapi Ia juga memberikan jaminan yang berupa materai Roh Allah (Roh Kudus) yang menyelamatkan. Hal ini membuat kehidupan dalam Kristus menjadi indah dan oleh karena itu hidup kita hendaknya boleh menjadi pujian bagi kemuliaan Allah.

Dengan demikian, kita bisa melihat bagaimana peran Allah Tritunggal dalam menjamin keselamatan anak-anak-Nya, di mana peran Bapa yang mengaruniakan Anak, Anak yang mengerjakan penebusan dan Roh Kudus yang memeteraikan.

Sebagai renungan, darah pengorbanan Tuhan menunjukkan betapa seriusnya dosa dan betapa kayanya kasih karunia yang Ia berikan. Untuk itu apakah kita benar-benar sudah menerima Dia dalam diri kita? Apakah dalam kehidupan sehari-hari kita sudah memuji Allah, memulai hidup kudus dan mempunyai kepastian juga damai sejahtera di dalam Dia? Kalau *belum*, bisa jadi kita *belum* berada penuh dalam Kristus dan masih memegang erat nilai-nilai lain di luar dari pada-Nya.$notes$, $tldr$### **TL;DR Ibadah 22.08.2026 : Di dalam Kristus (Efesus 1:1-14)**

Ibadah Steffen

Efesus adalah sebuah kota metropolitan dan religius, di mana banyak pemikiran baru muncul di sana, salah satunya pemikiran bahwa dewa adalah faktor terpenting dari kehidupan mereka, terutama dewi Artemis yang mereka sembah. Paulus menulis kepada jemaat di Efesus untuk mengingatkan para jemaat yang adalah kaum minoritas serta kemungkinan besar pada waktu itu dikucilkan, akan keselamatan di dalam Kristus Yesus dan berkat rohani yang diterima oleh anak-anak Nya.

- Election and Adoption (ay 4-6) & Redemption and Cosmic Purpose (ay 7-10)

Allah dalam Kristus menurut kehendak- dan kasih karunia-Nya memilih umat manusia menjadi anak-anak-Nya. Melalui darah suci-Nya, Ia menyelamatkan manusia dari dosa dan oleh karena itu tidak ada alasan bagi kita untuk meninggikan diri di hadapan-Nya.

- Inheritance, Hope, Glory (ay 11-12) & Kamu juga, di dalam Dia (ay 13-14)

Ketika mengikut Kristus, Ia pun juga memberikan janji untuk memegang kita dalam segala aspek kehidupan dan juga memberikan jaminan yang berupa materai Roh Allah, yang menyelamatkan dan membuat kehidupan dalam Kristus menjadi indah.

Kemudian kita bisa melihat bagaimana peran Allah Tritunggal dalam menjamin keselamatan umat manusia, di mana Bapa mengaruniakan Anak, Anak mengerjakan penebusan dan Roh Kudus memeteraikan.

Pengorbanan Tuhan menunjukan betapa seriusnya dosa dan betapa kayanya kasih karunia, lalu bagaimanakah dengan kita yang mengaku menerima Kristus? Apakah dalam keseharian kita sudah memuji Allah, memulai hidup kudus dan mempunyai damai sejahtera di dalam Dia? Atau masih adakah hal-hal yang membuat kita *belum* berada penuh dalam Kristus?$tldr$),
  ('2026-08-29', 'bible_study', $notes$### **29-08-2026 Doa untuk pengertian tentang kemuliaan Kristus (Efesus 1:15-23)**

PA Besar : Danny

Surat Efesus ditulis oleh Rasul Paulus sekitar tahun 60-62 AD ketika ia berada dalam penjara. Efesus merupakan kota besar di Asia Minor yang menjadi pusat perdagangan sekaligus pusat penyembahan dewi Artemis. Kota ini juga dikenal dengan praktik sihir. Dalam Kisah Para Rasul 19:19, orang-orang yang percaya kepada Kristus meninggalkan praktik tersebut dan membakar kitab-kitab sihir mereka.

Doa Paulus diawali dengan ucapan syukur karena ia mendengar tentang iman jemaat Efesus kepada Yesus Kristus dan kasih mereka kepada semua orang kudus (ay. 15–16). Iman kepada Kristus tidak berhenti pada pengakuan, tetapi terlihat dalam kehidupan yang percaya kepada Tuhan dan mengasihi sesama orang percaya. Paulus sendiri memberi teladan dengan terus mengucap syukur dan mendoakan jemaat. Sebagai orang yang telah menerima karya Roh Kudus dan menjadi milik Tuhan, kita dipanggil untuk hidup bersama dalam iman, saling mengasihi, serta saling menopang untuk memuliakan Tuhan.

Paulus berdoa agar Allah memberikan kepada jemaat Efesus “Roh hikmat dan wahyu” supaya mereka semakin mengenal Dia (ay. 17). Di tengah masyarakat yang mencari berbagai macam sumber kuasa, Paulus justru mengarahkan jemaat untuk mencari pengenalan yang benar akan Allah. Mengenal Allah bukan sekadar mengetahui informasi tentang-Nya, tetapi memiliki relasi dan persekutuan dengan-Nya. Yeremia 9:24 mengingatkan bahwa hal yang patut menjadi kebanggaan manusia adalah mengenal dan memahami Tuhan. Demikian pula Yohanes 17:3 menyatakan bahwa hidup kekal adalah mengenal Allah yang benar dan Yesus Kristus yang diutus-Nya. Karena itu, pertumbuhan iman tidak dapat dipisahkan dari kerinduan untuk terus mengenal Tuhan dengan lebih dalam.

Paulus juga berdoa agar mata hati jemaat diterangi sehingga mereka memahami pengharapan dari panggilan-Nya, kekayaan kemuliaan warisan bagi orang-orang kudus, dan betapa hebatnya kuasa Allah yang bekerja bagi mereka (ay. 18–19). Pengharapan itu menunjuk pada bagian mulia yang Allah sediakan bagi umat-Nya. Sebagai orang yang telah dipanggil dan menjadi milik Tuhan, kita memiliki pengharapan yang jauh melampaui keadaan kita saat ini. Karena itu, Paulus ingin jemaat menyadari betapa berharganya identitas dan bagian yang mereka terima di dalam Kristus.

Kuasa yang dimaksud bukanlah kuasa abstrak yang jauh dari kehidupan kita, tetapi kuasa yang sama yang membangkitkan Kristus dari antara orang mati, lalu mendudukkan-Nya di sebelah kanan Allah — sebuah posisi yang menggambarkan kehormatan dan otoritas mutlak. Kristus ditinggikan jauh di atas segala pemerintah, penguasa, kekuasaan, dan kerajaan. Tidak ada kuasa apa pun di semesta ini yang berada di atas Kristus (ay. 20-21).

Allah juga menempatkan segala sesuatu di bawah kaki Kristus dan menjadikan-Nya Kepala atas segala sesuatu bagi gereja, yang adalah tubuh-Nya (ay. 22–23). Hal ini menunjukkan besarnya kasih karunia Allah. Allah tidak membutuhkan manusia untuk menjadi sempurna atau lengkap, tetapi dalam kemuliaan dan kasih karunia-Nya, Ia justru berkenan merangkul manusia yang berdosa, yang dahulu hidup sebagai musuh-Nya, untuk menjadi bagian dari tubuh Kristus. Kita tidak memiliki apa pun yang dapat membuat kita layak menerima kehormatan tersebut; semuanya adalah anugerah Allah.

Karena itu, kita tidak perlu hidup dalam ketakutan terhadap kuasa atau keadaan apa pun yang terasa lebih besar daripada kita. Kristus jauh lebih besar, dan kuasa-Nya bekerja bagi kita yang percaya. Yang kita perlukan adalah mata hati yang diterangi agar mampu melihat kehidupan bukan hanya dari masalah yang sedang kita hadapi, tetapi dari perspektif tentang siapa Kristus dan betapa besar kasih karunia serta kuasa-Nya.

Sebagai perenungan, apakah kita sudah benar-benar mengenal Tuhan dan mengalami betapa berharganya dan besarnya kuasa Tuhan?$notes$, $tldr$### **TL;DR PA Besar 29.08.2026 : Doa untuk pengertian tentang kemuliaan Kristus (Efesus 1:15-23)**

PA Besar: Danny

Paulus bersyukur mendengar tentang iman jemaat Efesus kepada Kristus dan kasih mereka kepada sesama. Hal ini mengingatkan kita bahwa iman yang sejati tidak berhenti pada pengakuan, tetapi terlihat melalui kehidupan dan kasih kepada orang lain. Seperti Paulus, kita juga dipanggil untuk terus mendoakan dan menopang saudara seiman.

Paulus kemudian berdoa agar jemaat menerima Roh hikmat dan wahyu sehingga semakin mengenal Allah. Mengenal Tuhan bukan sekadar mengetahui tentang Dia, tetapi memiliki relasi yang semakin dalam dengan-Nya. Paulus juga berdoa agar mata hati mereka diterangi untuk memahami pengharapan dalam panggilan Tuhan, kekayaan warisan-Nya, dan besarnya kuasa-Nya bagi orang percaya. Kuasa yang bekerja dalam diri kita adalah kuasa yang membangkitkan Kristus dari kematian dan menempatkan-Nya jauh di atas segala kuasa. Kristus adalah Kepala gereja, dan kita adalah bagian dari tubuh-Nya.

Hal ini menunjukkan betapa besar kasih karunia Allah. Allah tidak membutuhkan manusia untuk menjadi sempurna atau lengkap, tetapi dalam kemuliaan dan kasih karunia-Nya, Ia justru merangkul manusia yang berdosa, yang dahulu menjadi musuh-Nya untuk menjadi bagian dari tubuh Kristus. Karena itu, jangan hidup dalam ketakutan terhadap keadaan atau kuasa apa pun. Kiranya mata hati kita terus diterangi untuk mengenal siapa Kristus, menyadari kuasa-Nya, dan percaya bahwa hidup kita berada di dalam tangan-Nya.

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-09-05', 'bible_study', $notes$### **05-09-2026 Semuanya Adalah Kasih Karunia (Efesus 2:1-10)**

PA Besar : Billy

Rasul Paulus memulai suratnya kepada jemaat Efesus dengan memaparkan doktrin-doktrin dasar iman Kristen. Ia mula-mula menyatakan betapa berharga dan kayanya berkat-berkat Tuhan yang mereka terima dalam Yesus, serta mendoakan agar mereka bisa mengenal Tuhan lebih dalam lagi (pasal 1). Selanjutnya Paulus mengingatkan jemaat Efesus akan keadaan mereka sebelum mengenal Tuhan, bahwa dulu mereka mati dalam dosa. “Mati” di sini bermakna keterpisahan dari Tuhan dan kematian rohani, saat seseorang hanya hidup menuruti keinginannya sendiri dan tidak mampu membangun hubungan dengan Tuhan. Kematian ini disebabkan oleh dosa manusia; dosa merusak gambar Allah dalam diri manusia, membuatnya durhaka dan memberontak kepada-Nya. Keadaan “mati” ini juga hasil pekerjaan penguasa dunia (iblis), yang terus mencobai manusia untuk menganut cara pikir duniawi/dosa. Hasilnya, mereka yang masih hidup dalam dosa ada di bawah murka Allah (ay. 3)!

Tetapi, Allah yang kaya akan rahmat dan kasih terhadap manusia mengutus Anak-Nya Yesus ke dalam dunia, untuk mati bagi dosa manusia! Ini adalah bentuk kasih karunia/anugerah Allah, bukan sesuatu yang pantas kita dapatkan. Kita juga diberikan janji bahwa di masa yang akan datang, saat kita sudah bersama Tuhan, Dia akan menyatakan kepada kita betapa besarnya anugerah yang sudah Dia beri kepada kita dalam Yesus, sesuatu yang akan membuat kita sungguh terkagum-kagum (ay. 7). Bahkan dari saat ini pun kita sudah bisa mulai merasakan keselamatan dan kehidupan kekal yang Tuhan berikan kepada kita (ay. 5-6)! Semua hal ini murni adalah hasil dari anugerah dan kebaikan Tuhan, bahkan iman yang bisa kita miliki terhadap Dia juga adalah pemberian-Nya (ay. 8). Oleh karena itu, kita tidak bisa menyombongkan apa-apa (ay. 9)!

Sekarang, setelah kita menerima keselamatan yang dari Tuhan, kita juga punya harapan bahwa Roh Kudus akan mengerjakan/membuahkan dalam hidup kita perbuatan-perbuatan baik, yang sudah Ia siapkan sebelumnya (ay. 10). Perbuatan-perbuatan baik ini adalah perbuatan yang tidak mengikuti natur dosa kita, melainkan yang bertujuan untuk memuliakan dan melayani Tuhan. Kehendak Tuhan adalah supaya kita hidup di dalam Dia, mengerjakan perbuatan-perbuatan baik ini!

Mari kita renungkan, apakah cara dan tujuan hidup kita sudah sesuai dengan apa yang Tuhan kehendaki? Apakah Tuhan sudah mengubahkan hidup kita sehingga terlihat perbuatan-perbuatan baik sebagai buah pertobatan kita? Apakah kita juga sudah menyadari betapa besarnya kasih karunia Allah?$notes$, $tldr$### **TL;DR PA Besar 05.09.2026 : Semuanya Adalah Kasih Karunia (Efesus 2:1-10)**

PA Besar: Billy

Setelah memaparkan kepada jemaat Efesus tentang berkat-berkat rohani yang mereka terima dalam Yesus, rasul Paulus melanjutkan suratnya dengan mengingatkan mereka akan keselamatan mereka. Dahulu, mereka adalah orang-orang yang mati dalam dosa, hidup mengikuti keinginan sendiri dan tidak bisa mendekat kepada Tuhan. Dengan itu, mereka sebenarnya berhak menerima murka Allah.

Tetapi, Allah dalam kasih karunia-Nya mengirimkan Anak-Nya Yesus untuk mendamaikan mereka dengan Dia! Yesus menanggung dosa-dosa mereka. Ia juga menjanjikan hidup kekal dan tempat bersama-sama Dia di surga. Sekarang pun janji itu sedang digenapi, karena dari sekarang kita sudah bisa merasakan keselamatan dan hidup kekal yang Tuhan berikan!

Lalu bagaimana kita hidup setelah menerima keselamatan? Tuhan ingin kita mengerjakan perbuatan-perbuatan baik, yang tidak berdasarkan keinginan dosa tapi keinginan untuk memuliakan Dia! Roh Kudus juga yang akan membantu mengerjakan perbuatan-perbuatan ini dalam diri kita. Sudahkah perbuatan-perbuatan ini terlihat dalam hidup kita? Sudahkah juga kita menyadari betapa besarnya anugerah Tuhan bagi kita?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-09-12', 'church_service', $notes$### **12-09-2026 No Longer Strangers (Efesus 2:11-22)**

Ibadah : Pdt. Titus C

Bila di surat Efesus audiens Paulus adalah jemaat Efesus yang berasal dari golongan Yahudi maupun non-Yahudi, di perikop kali ini Paulus ingin berbicara lebih spesifik kepada jemaatnya yang merupakan golongan non-Yahudi. Di sini Paulus berbicara kepada mereka yang sering dianggap sebagai *outsider*, di mana mereka bukan merupakan keturunan Abraham dan tidak disunat. Oleh karena itu mereka sering dianggap bukan umat perjanjian Allah oleh golongan Yahudi (ay. 11-12). Bahkan Paulus mengatakan bahwa mereka hidup tanpa pengharapan dan tanpa Allah di dunia ini sebelum mereka mengenal Kristus. Penggambaran ini juga adalah penggambaran kita tanpa Kristus karena dosa. Dosa, yang merupakan pemberontakkan terhadap Kristus, membuat kita menjadikan diri sendiri pusat dalam hidup kita, sehingga kita merasa tidak membutuhkan Kristus. 

Tetapi sekarang, oleh pengorbanan darah Kristus di kayu salib yang menyucikan dosa kita, kita yang dahulu “jauh” sudah menjadi “dekat” (ay. 13). Kristus melalui salib-Nya melakukan pendamaian tidak hanya untuk hubungan Allah dengan manusia, tetapi juga manusia dengan sesamanya (ay. 14). Manusia tidak lagi dikelompokkan menjadi golongan Yahudi dan non-Yahudi secara terpisah, tetapi dipersatukan menjadi satu manusia baru yang memiliki status dan identitas baru, di mana Kristus menjadi fokusnya (ay. 15-16). Yesus melenyapkan perseteruan dan menyatukan golongan-golongan yang berbeda dalam satu Roh, sehingga kita semua boleh beroleh jalan masuk kepada Bapa (ay. 18).

Implikasi dari perubahan ini adalah kita bukan lagi orang asing dan pendatang (ay. 19). Secara konteks zaman itu, pesan ini menjadi sukacita bagi golongan non-Yahudi karena mereka bukan lagi *outsider* dan diperbolehkan bersatu dengan golongan Yahudi di dalam Kristus. Bagi kita orang percaya, Paulus memberikan 3 penggambaran mengenai perubahan identitas kita. Pertama, Paulus menyatakan bahwa kita menjadi warga kerajaan Allah (ay. 19). Jikalau mempunyai kewarganegaraan tertentu artinya mendapatkan kekuatan dan hak istimewa tertentu, kita yang sekarang percaya menjadi bagian dari umat Allah yang sama, memiliki hak istimewa serta status yang sama di hadapan Allah. Kedua, kita menjadi anggota-anggota keluarga Allah (ay. 19). Artinya, semua orang percaya adalah saudara-saudara kita karena Kristus sendiri yang menyatukan kita di dalam keluarga-Nya. Kuasa Kristus yang mampu menyatukan ini bahkan melebihi segalanya!

Ketiga, Paulus memberikan gambaran mengenai bait Allah. Bait Allah, yang merupakan tempat di mana Allah berdiam pada zaman dulu, tidak dibangun dengan sembarangan. Kita masing-masing yang percaya digambarkan dibangun rapi tersusun menjadi bait Allah. Ini artinya, kita dirancang untuk tidak berdiri sendiri sebagai orang percaya, tetapi berelasi dengan orang percaya lainnya dalam membangun bait Allah yang utuh. Di sisi lain, Paulus menggambarkan Yesus sebagai batu penjuru, batu yang dijadikan acuan dalam pembangunan satu bangunan, dari bait Allah itu sendiri. Artinya, Yesus menjadi acuan, pusat, serta fondasi dari kehidupan orang percaya. Melalui Yesus, kehidupan orang percaya dibangun menjadi satu bait Allah yang indah.

Sebagai perenungan, siapakah kita tanpa Kristus dan anugerah-Nya? Hendaklah kita senantiasa datang pada Kristus dan bersyukur akan identitas baru yang telah kita terima lewat-Nya. Hendaklah kita hidup sebagai satu keluarga Allah yang saling mengasihi dan memperhatikan.$notes$, $tldr$### **TL;DR Ibadah 12.09.2026 : No Longer Strangers (Efesus 2:11-22)**

Ibadah: Pdt. Titus

Di perikop kali ini audiens Paulus secara spesifik adalah golongan non-Yahudi, yang sering dianggap sebagai *outsider* karena mereka bukan merupakan keturunan Abraham dan tidak disunat. Oleh karena itu mereka sering dianggap bukan umat perjanjian Allah oleh golongan Yahudi (ay. 11-12).

Penggambaran ini juga adalah penggambaran kita tanpa Kristus karena dosa, yang membuat kita merasa tidak membutuhkan Kristus. Tetapi sekarang, oleh pengorbanan darah Kristus di kayu salib yang menyucikan dosa kita, kita yang dahulu “jauh” sudah menjadi “dekat” (ay. 13).

Implikasi dari perubahan ini adalah kita bukan lagi orang asing dan pendatang (ay. 19). Kita menjadi warga kerajaan Allah (ay. 19), yang sekarang menjadi bagian dari umat Allah yang sama, memiliki hak istimewa serta status yang sama di hadapan Allah. Kristus menjadikan kita anggota-anggota keluarga Allah (ay. 19), sehingga semua orang percaya adalah saudara-saudara kita. Melalui Kristus sebagai batu penjuru, kita yang percaya masing-masing dibangun rapi tersusun menjadi bait Allah yang utuh.

Hendaklah kita senantiasa datang pada Kristus dan bersyukur akan identitas baru yang telah kita terima lewat-Nya. Hendaklah kita hidup sebagai satu keluarga Allah yang saling mengasihi dan memperhatikan.

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-09-19', 'bible_study', $notes$### **19-09-2026 God’s Marvelous Plan for the Gentiles  (Efesus 3 : 1-13)**

PA Besar : Ci Wynonna

Di perikop ini, Paulus menggambarkan panggilan Allah sebagai satu misteri / rahasia. Kata "*mystery*" berasal dari bahasa Yunani mysterion, yang berarti revelation atau wahyu yang tidak mampu disingkapkan oleh tangan manusia sendiri melainkan melalui campur tangan ilahi.

1. Hardness of Life (ayat 1-2)

Sebagai background, surat Efesus sendiri ditulis oleh Paulus ketika ia sedang dipenjara di Roma. Pada ayat 1–2, Paulus menyebut dirinya "tahanan Kristus" (*prisoner of Christ*) karena menyadari bahwa tugasnya merupakan panggilan langsung dari Allah. Ia tahu bahwa pelayanannya akan membawanya pada penderitaan, tetapi walaupun begitu tetap menerima dan menjalankan panggilan itu dan tetap setia memberitakan Injil. Paulus sendiri mengerti bahwa penderitaannya dalam melayani akan membuat jemaat Efesus tawar hati (ay 13), tetapi lewat perikop ini memberikan penguatan kepada mereka bahwa apa yang dia kerjakan akan menjadi kemuliaan mereka. Sebagai refleksi: apakah kita masih bisa percaya kepada Tuhan ketika mengalami penderitaan seperti yang dialami Paulus? Walaupun berada di dalam penjara, Paulus tetap memiliki pengharapan yang sangat kuat di dalam Kristus, dan kita dipanggil untuk memiliki iman yang sama, yaitu tetap percaya kepada Tuhan Yesus ketika sedang bergumul atau menderita.

1. The wonder of Grace (ayat 3-9)

Di ayat 3–9, kita melihat keajaiban kasih karunia.  Inti rahasianya adalah bahwa orang non-Yahudi (*gentiles*) menjadi ahli waris, bagian / anggota dari satu tubuh, dan peserta dalam janji yang dimeteraikan oleh Kristus. Berita keselamatan ini berlaku untuk semua orang, tidak hanya bagi bangsa Yahudi. Inilah alasan mengapa pesan ini disebut keajaiban kasih, sebab Injil dan Kabar Baik ditujukan bagi seluruh umat manusia tanpa terkecuali. Maka refleksi pribadinya: apakah Injil sudah menjadi suatu keajaiban (*wonder*) dalam hidupku?

1. The brilliance of the church (ayat 10-11)

Pada ayat 10–11, Paulus ingin menekankan keberagaman dalam komunitas / gereja. Hidup kita tidak dirancang untuk berjalan sendiri-sendiri dan kita dipanggil untuk hidup saling terhubung dan meninggalkan sifat individualistis. Tertulis di Efesus 1:8-10, Kristus mempersatukan orang-orang yang beragam ini. Ia memperbaiki hubungan antara kita dengan Allah dan juga kita dengan sesama.

1. The freedom that comes (ayat 12-13)

Pada ayat 12–13, Paulus kembali mengingatkan jemaat di Efesus bahwa mereka telah memiliki akses langsung menuju keselamatan karena pengorbanan Tuhan Yesus di kayu salib. Karena itu, kita beroleh keberanian (*courage*) untuk kembali kepada Allah dan senantiasa memelihara iman kepada-Nya (ay. 12).

Sebagai perenungan, bagaimanakah respons kita saat badai melanda? Apakah kita semakin dekat / semakin jauh dari Tuhan? Lalu, apakah Injil telah menjadi keajaiban dalam hidupku?$notes$, $tldr$### **TL;DR PA Besar 19.09.2026 : God’s Marvelous Plan for the Gentiles  (Efesus 3 : 1-13)**

PA Besar : Ci Wynonna

Surat Efesus ditulis oleh Paulus ketika ia sedang ditahan di Roma. Paulus yang menuliskan dirinya sebagai “tahanan Kristus” (*prisoner of Christ*), menyadari bahwa ia telah menerima panggilan dari Allah untuk memberitakan Injil. Meskipun harus menderita, ia tetap menerima dan menjalankan panggilan tersebut.

Melalui Paulus, di tengah masa penahanannya di penjara, kita menerima kabar gembira mengenai rahasia panggilan Allah. Inti dari rahasia tersebut adalah bahwa orang-orang non-Yahudi (*gentiles*) kini menjadi ahli waris, bagian dari satu tubuh, dan peserta dalam janji yang dimeteraikan oleh Kristus. Berita keselamatan ini berlaku untuk semua orang, tidak hanya bagi bangsa Yahudi.

Lebih lanjut, Paulus menekankan bahwa kita tidak dirancang untuk berjalan sendiri. Kita dipanggil untuk hidup saling terhubung tanpa memedulikan perbedaan ras maupun latar belakang, karena kita adalah satu di dalam Kristus Yesus. Paulus juga mengingatkan bahwa kita telah memiliki akses menuju keselamatan yang dianugerahkan Allah dan beroleh keberanian untuk kembali kepada Allah.

Mari kita merenungkan: bagaimanakah respons kita saat badai melanda? Apakah Injil masih menjadi keajaiban dalam hidup kita? Apakah kita semakin mendekat atau justru menjauh dari Tuhan?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-09-26', 'church_service', $notes$### **26-09-2026 Doa yang Membangun  (Efesus 3 : 14-21)**

Ibadah: Ko Willy

Dalam kehidupan beragama tentu tidak terlepas dari kegiatan doa. Bagi orang percaya, doa adalah suatu persekutuan pribadi antara kita dan Allah Tritunggal, yang mencakup beberapa bagian seperti meninggikan, menyembah, memohon sesuatu dan mengaku dosa. Seringkali kita berdoa langsung mengenai permasalahan-permasalahan yang kita alami. Tentu ini tidak salah, karena Tuhan izinkan juga supaya kita memberitahu keluh kesah kepada-Nya (Yoh 16:24, Filipi 4:6). Namun apakah doa kita sudah memuliakan Tuhan?

Untuk itu, dalam suratnya kali ini, kita bisa belajar bagaimana struktur doa yang Paulus tuliskan untuk pergumulan jemaat di Efesus. Pergumulan tersebut muncul karena adanya perbedaan antara orang Yahudi yang memegang erat kulturnya dan orang non-Yahudi yang memiliki latar belakang penyembahan berhala, sehingga menimbulkan pertentangan di antara mereka.Di tengah keadaan tersebut, Paulus menuliskan sebuah doa agar jemaat di Efesus mengalami pertumbuhan dan berkat rohani dalam menghadapi tantangan iman mereka.

Doa Paulus dibuka dengan menunjukkan sikap sujud (ay.14) untuk menunjukkan Allah sebagai sumber otoritas tertinggi dan hanya kerendahan diri saja yang bisa ia tunjukkan. Yesus sebagai Allah Putra pun juga menunjukkan sikap yang sama, ketika Ia berdoa kepada Allah Bapa di taman Getsemani. Dalam berdoa pun sudah seharusnya kita menunjukkan sikap kerendahan hati dan menyadari penuh anugerah Allah. Kemudian, Paulus pun mendoakan semua orang percaya sebagai kesatuan tubuh Kristus (ay.15).

Ayat yang ke-16-17 menunjukkan isi doa Paulus bagian pertama dengan menekankan akan kuasa Roh Kudus, yang membedakan orang percaya dan tidak. Kekuatan Roh Kudus Allah berikan kepada seluruh anak-anak-Nya yang mau mencari, menekuni dan hidup berdasarkan kebenaran Allah. Karena hanya dengan Roh Kudus sajalah setiap orang percaya bisa hidup berkenan di hadapan Allah, dan Paulus ingin agar jemaat di Efesus juga menerima anugerah Roh Kudus.

Di bagian kedua (ay. 18–19a), Paulus berdoa agar jemaat semakin mengenal kasih Kristus. Pengenalan ini hanya dapat bertumbuh ketika mereka berakar di dalam Kristus dan hidup dalam kesatuan persekutuan. Melalui relasi yang aktif dalam persekutuan, jemaat akan mengalami pemulihan rohani dan semakin dikuduskan, yaitu dipisahkan dari cara hidup dunia.

Pada bagian akhir (ay.19b) Paulus berdoa agar para jemaat diperkenankan untuk mencicipi kepenuhan Allah, yang sudah dinyatakan pada salib Kristus Yesus. Kepenuhan Allah mempunyai arti, bahwa hidup mereka sudah sepenuhnya dibawah kendali Roh Kudus tanpa adanya ego duniawi dan didasari oleh kasih Yesus.

Untuk menutupi doa nya, Paulus mengucap syukur akan kemuliaan Allah yang harus menjadi tujuan akhir dari setiap doa kita. Paulus percaya, ketika kuasa Allah sudah bekerja atas orang percaya, maka hasilnya akan jauh melampaui dari apa yang kita doakan atau pikirkan.

Doa Paulus ini juga relevan bagi gereja masa kini, yang ditantang untuk tetap berdiri dalam kebenaran sejati di tengah berbagai perbedaan dan pengaruh dunia. Kita perlu berhati-hati agar tidak kehilangan kesetiaan kepada Kristus seperti yang kemudian terjadi dalam perkembangan jemaat di Efesus. Ketika Timotius melanjutkan pelayanan Paulus di Efesus, jemaat menghadapi berbagai ajaran sesat yang menimbulkan perdebatan dan mengganggu kehidupan iman mereka. Dalam Wahyu pasal 2, jemaat Efesus memang dipuji karena ketekunan mereka dan karena mampu menolak ajaran yang salah, tetapi mereka ditegur karena telah meninggalkan kasih mereka yang semula.

Untuk itu sebagai refleksi, kita perlu melihat kehidupan doa yang kita jalani. Apakah kita sudah berdoa dengan sikap hati yang benar, tanpa adanya ego dari dalam diri kita? Apakah kita juga sudah memuliakan Allah, serta mendoakan juga berkat-berkat rohani seperti keselamatan sesama seperti yang sudah Paulus lakukan?$notes$, $tldr$### **TL;DR Ibadah 26.09.2026 : Doa yang Membangun  (Efesus 3 : 14-21)**

Ibadah Ko Willy

Di suratnya kali ini, kita bisa belajar dari struktur doa Paulus untuk pertumbuhan iman jemaat di Efesus, yang saat itu sedang bertentangan akibat perbedaan latar belakang kultur Yahudi dan non-Yahudi. Doa Paulus terdiri dari tiga struktur

- Pembuka, Paulus membuka doa dengan sikap sujud, untuk menunjukkan Allah sebagai sumber otoritas tertinggi dalam  kerendahan diri dan setelah itu ia pun mendoakan semua orang percaya sebagai kesatuan tubuh Kristus.
- Isi, Paulus menekankan akan kuasa Roh Kudus, yang membedakan orang percaya dan tidak. Roh Kudus telah diberikan Allah kepada seluruh anak-anak-Nya yang mau mencari, menekuni dan hidup berdasarkan kebenaran Allah. Paulus juga menekankan akan kasih Kristus, yang hanya dapat bertumbuh ketika kehidupan kita berakar di dalam Kristus dan dalam persekutuan. Ia pun juga mendoakan agar para jemaat diperkenankan mencicipi kepenuhan Allah yang berarti hidup mereka sudah sepenuhnya dibawah kendali Roh Kudus dan didasari oleh kasih Yesus.
- Penutup, Paulus mengucap syukur akan kemuliaan Allah yang menjadi tujuan akhir dari setiap doa kita. Ketika kuasa Allah sudah bekerja atas kita, maka hasilnya akan jauh melampaui dari apa yang kita doakan atau pikirkan.

Doa Paulus yang ditulis sekitar tahun 60 A.D. ini nyatanya juga relevan bagi gereja masa kini, yang ditantang untuk tetap berdiri dalam kebenaran sejati di tengah berbagai perbedaan dan pengaruh dunia. Kita pun perlu berhati-hati agar tidak kehilangan kesetiaan kepada Kristus seperti yang kemudian terjadi dalam perkembangan jemaat di Efesus.

Untuk itu sebagai refleksi, kita perlu melihat kehidupan doa yang kita jalani. Apakah kita sudah berdoa dengan sikap hati yang benar, tanpa adanya ego dari dalam diri kita? Apakah kita juga sudah memuliakan Allah, serta mendoakan juga berkat-berkat rohani seperti keselamatan sesama orang percaya seperti yang sudah Paulus lakukan?

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-10-03', 'bible_study', $notes$### **03-10-2026 Kesatuan Jemaat dan Karunia yang Berbeda-beda (Efesus 4 : 1-16)**

PA Besar: Aldi

Surat Efesus ditulis Rasul Paulus ketika berada di penjara. Paulus sebelumnya melayani di Efesus, kota yang kuat dengan penyembahan Dewi Artemis dan praktik ilmu sihir. Pemberitaan Injil bahkan menimbulkan keresahan karena dianggap mengancam bisnis penyembahan Artemis (Kis. 19:24–28). Di tengah lingkungan tersebut, orang percaya hidup sebagai minoritas. Dalam tiga pasal pertama, Paulus mengingatkan bahwa mereka telah dipilih, ditebus, dan dijadikan satu keluarga di dalam Kristus. Kristus adalah Kepala dan mereka adalah bagian dari tubuh-Nya.

1. Kesatuan dalam tubuh Kristus (ay. 1–6)

Setelah menjelaskan kekayaan iman mereka, Paulus menunjukkan bagaimana jemaat seharusnya hidup sesuai dengan panggilan yang telah diterima. Mereka telah dipersatukan oleh satu pengharapan, satu iman, satu baptisan, satu Roh, serta satu Allah dan Bapa (ay. 5-6). Karena itu, Paulus meminta mereka untuk memelihara kesatuan Roh dalam ikatan damai sejahtera.

Kesatuan ini diwujudkan melalui kerendahan hati, kelemahlembutan, dan kesabaran. Kita dipersatukan bukan karena kesamaan latar belakang, kepribadian, atau minat, melainkan karena menerima keselamatan yang sama di dalam Kristus. Karena itu, kita dipanggil untuk membangun hubungan yang erat dengan sesama orang percaya, termasuk mereka yang berbeda dari kita. **Apakah kita sudah turut memelihara kesatuan dan menjadi pembawa damai sejahtera di tengah tubuh Kristus?**

1. Karunia rohani di dalam tubuh Kristus (ay. 7–12)

Meskipun kita dipersatukan, kesatuan tidak berarti keseragaman (*unity is not uniformity*). Setiap orang percaya menerima karunia rohani dan panggilan pelayanan yang berbeda untuk melayani dan membangun tubuh Kristus. Ada yang dipanggil sebagai pengajar, gembala, atau pemberita Injil. Perbedaan karunia bukan alasan untuk membandingkan diri atau merasa lebih penting, melainkan kesempatan bagi setiap anggota untuk saling melengkapi.

Karena itu, kita diajak untuk mengenali karunia yang Tuhan percayakan dan berani mengeksplorasi berbagai bentuk pelayanan. **Apa karunia yang Tuhan berikan kepada saya? Apakah saya sudah menggunakannya untuk melayani dan membangun sesama?**

1. Bertumbuh di dalam tubuh Kristus (ay. 13–16)

Tujuan pelayanan dan berbagai karunia bukan sekadar agar gereja memiliki banyak aktivitas, tetapi agar seluruh tubuh bertumbuh menuju kedewasaan dalam Kristus. Paulus menggambarkan orang yang belum dewasa dalam iman seperti anak-anak yang mudah diombang-ambingkan oleh berbagai ajaran. Karena itu, kita dipanggil untuk terus bertumbuh dalam kesatuan iman dan pengenalan yang benar akan Kristus, sehingga semakin menyerupai-Nya dalam pikiran dan perbuatan.

Pertumbuhan ini tidak dirancang untuk dilakukan sendirian. Kristus adalah Kepala, sedangkan kita adalah bagian dari satu tubuh yang saling terhubung. Setiap anggota memiliki fungsi yang berbeda, tetapi semuanya bekerja bersama dan saling membantu. Karena itu, kita dipanggil untuk saling memperhatikan, menolong, dan membangun agar seluruh tubuh bertumbuh bersama menuju Kristus. Kita memiliki satu Kepala, satu keluarga, dan satu misi, dengan karunia yang berbeda untuk tujuan yang sama.

Efesus 4:1–16 mengingatkan kita bahwa sebagai satu keluarga di dalam Kristus, kita dipanggil untuk **memelihara kesatuan, menggunakan karunia yang Tuhan berikan, dan bertumbuh bersama menuju kedewasaan dalam Kristus.** Perbedaan karunia bukan untuk dibandingkan, tetapi untuk saling melayani dan membangun.

**Apakah persekutuan kita sungguh dipersatukan oleh Kristus, atau hanya karena kita merasa cocok dan sefrekuensi?**$notes$, $tldr$### **TL;DR PA Besar 03.10.2026 : Kesatuan Jemaat dan Karunia yang Berbeda-beda (Efesus 4 : 1–16)**

PA Besar: Aldi

Kekristenan di kota Efesus pada masa itu merupakan minoritas yang hidup di tengah kuatnya penyembahan berhala. Untuk menguatkan jemaat, Paulus mengingatkan betapa kayanya status mereka yang telah ditebus dan dijadikan satu keluarga baru di bawah kepemimpinan Kristus. Sebagai respons atas anugerah tersebut, kita dipanggil untuk memelihara kesatuan Roh dalam ikatan damai sejahtera melalui kerendahan hati, kelemahlembutan, kesabaran, dan kasih, sekalipun memiliki latar belakang yang berbeda.

Dalam kesatuan tersebut, Tuhan memberikan karunia rohani dan panggilan pelayanan yang berbeda kepada setiap orang percaya agar kita dapat saling melengkapi dan membangun tubuh Kristus. Kesatuan bukan berarti keseragaman; setiap anggota memiliki fungsi dan peran masing-masing. Karena itu, kita diajak untuk mengenali dan menggunakan karunia yang Tuhan percayakan, bukan untuk membandingkan diri, tetapi untuk melayani dan memperlengkapi sesama agar bersama-sama bertumbuh dalam iman.

Pada akhirnya, pertumbuhan rohani tidak dirancang untuk dilakukan sendirian. Kita adalah satu tubuh dengan Kristus sebagai Kepala, dan setiap anggota saling terhubung serta membutuhkan satu sama lain. Kita dipanggil untuk bertumbuh menuju kedewasaan rohani, semakin mengenal dan menyerupai Kristus. Karena itu, kita perlu saling memperhatikan, menolong, dan menegur dalam kasih, sebab pertumbuhan maupun jatuhnya satu anggota dapat berdampak pada seluruh tubuh. Dengan demikian, kita bersama-sama menjaga kesatuan, membangun tubuh Kristus, dan menjadi kesaksian bagi dunia.

Selamat mengawali minggu yang baru untuk teman2 Perki Aachen 👋God bless!$tldr$),
  ('2026-10-10', 'church_service', $notes$### **10-10-2026 Hidup Baru yang Terlihat (Efesus 4 : 17-32)**

Ibadah: Pdt. Titus

Di Efesus 3:6, Paulus menyatakan bahwa terjadi perubahan status orang-orang non-Yahudi, di mana kita turut menjadi ahli-ahli waris, anggota-anggota tubuh dan peserta dalam janji yang diberikan dalam Kristus Yesus. Di Efesus 2:19, dituliskan juga bahwa kita adalah anggota-anggota keluarga Allah, di mana Kristus Yesus menjadi batu penjuru. Di perikop kali ini, Paulus ingin berbicara mengenai bagaimana orang-orang yang telah mengalami transformasi status ini seharusnya bertindak. Ia percaya, bahwa tidak mungkin seseorang yang menerima status baru ini tidak mengalami perubahan.

Lewat ayat 17-19, Paulus meminta kita untuk menanggalkan pola hidup yang lama dan jangan hidup seperti orang yang tidak mengenal Allah dengan pikirannya yang sia-sia dan pengertiannya yang gelap. Paulus percaya bahwa masalah dosa bukan dimulai dari tindakan nyata, tapi dimulai dari cara pandang dan arah berpikir seseorang. Cara pandang yang salah membawa seseorang melakukan dosa (seperti kebodohan, kedegilan hati (ay 18), hawa nafsu dan keserakahan (ay 19)). Oleh sebab itu, orang percaya harus hidup dalam pikiran yang serupa dengan Kristus.

Di ayat 20-24, Paulus menjelaskan bagaimana orang percaya hidup menurut identitas baru dalam Kristus. Orang-orang percaya adalah kita yang telah benar-benar mengenal Kristus, mendengar tentang Dia dan menerima pengajaran di dalam Dia (ay 21). Paulus lalu menggambarkan tiga gambaran langkah yang harus dilakukan orang percaya. Kita yang percaya, harus menanggalkan manusia lama, yang hidup dalam hawa nafsu yang menyesatkan (ay 22). Kita lalu dibaharui di dalam roh dan pikiran (ay 23) serta mengenakan manusia baru, yang diciptakan di dalam kebenaran dan kekudusan Allah (ay 24).

Kemudian, Paulus menjelaskan bahwa kehidupan dalam identitas baru akan terlihat dalam relasi sehari-hari (ay 25-32). Dalam kehidupan baru ini, kita hendaknya membuang dusta dan berkata dengan benar (ay 25). Kejujuran menjadi hal yang sangat penting karena dusta akan merusak komunitas Kristen dan kepercayaan orang. Kejujuran mencakup mengatakan kebenaran secara utuh, tanpa kebenaran itu sendiri harus ditambah-tambahkan maupun dikurangi.

Lalu, Paulus mengatakan bahwa kita boleh marah, tetapi jangan dalam marah, kita berbuat dosa. Ia juga menasihatkan kita agar janganlah matahari terbenam, sebelum padam amarah kita (ay 26). Artinya, orang percaya boleh marah atas ketidakadilan yang terjadi, tetapi tidak boleh menyimpan kemarahan itu serta membiarkan iblis menguasai dan mewarnai amarah itu (ay 27). Di ayat 28, Paulus ingin kita bukan hanya tidak mencuri, tetapi mendorong kita orang percaya untuk bekerja dan menjadi berkat bagi orang lain dalam pemberian. Perkataan kotor hendaknya juga jauh dari mulut kita, karena dari mulut yang sama keluar berkat maupun perkataan kotor (ay 29). Hendaknya justru yang keluar dari mulut kita adalah berkat dan kasih bagi orang yang mendengarnya. Setelah itu, Paulus menasihatkan kita untuk tidak mendukakan Roh Kudus yang tinggal dalam kita dan menjadi meterai orang percaya (ay 30). Di ayat selanjutnya (ay 31-32), Paulus mengajak kita untuk membuang segala kepahitan hingga kejahatan dari antara kita. Kita dituntut untuk saling mengasihi dan juga saling mengampuni sebagaimana Kristus telah mengampuni kita.

Sebagai aplikasi, hendaklah kita memeriksa pola pikir yang membentuk cara pikir kita. Manusia / pakaian lama apa yang belum kita tanggalkan? Apakah dalam perkataan kita sudah menjadi berkat untuk orang lain? Apakah kita telah sungguh-sungguh saling mengasihi dan mengampuni?$notes$, $tldr$### **TL;DR Ibadah 10.10.2026 : Hidup Baru yang Terlihat (Efesus 4 : 17-32)**

Ibadah Pdt. Titus

Di perikop ini, Paulus ingin berbicara mengenai bagaimana orang-orang yang telah mengalami transformasi status di hadapan Allah seharusnya bertindak. Lewat ayat 17-19, Paulus meminta kita untuk tidak hidup seperti orang yang tidak mengenal Allah dengan pikirannya yang sia-sia dan pengertiannya yang gelap.

Orang-orang percaya adalah kita yang telah benar-benar mengenal Kristus, mendengar tentang Dia dan menerima pengajaran di dalam Dia (ay 21). Kita yang percaya, harus menanggalkan manusia lama, yang hidup dalam hawa nafsu yang menyesatkan (ay 22). Kita lalu dibaharui di dalam roh dan pikiran (ay 23) serta mengenakan manusia baru, yang diciptakan di dalam kebenaran dan kekudusan Allah (ay 24).

Kemudian, Paulus menjelaskan bahwa kehidupan dalam identitas baru akan terlihat dalam relasi sehari-hari (ay 25-32). Paulus menasihatkan agar membuang dusta dan berkata dengan benar (ay 25), bekerja dan menjadi berkat bagi orang lain dalam pemberian (ay 28), menjauhkan perkataan kotor (ay 29), tidak mendukakan Roh Kudus (ay 30), dan membuang segala kepahitan hingga kejahatan dari antara kita (ay 31-32). Lalu, Paulus mengatakan bahwa kita boleh marah, tetapi jangan dalam marah, kita berbuat dosa dan membiarkan iblis menguasai amarah itu (ay 26-27). Akhirnya, kita dituntut untuk saling mengasihi dan juga saling mengampuni sebagaimana Kristus telah mengampuni kita (ay 32).

Manusia / pakaian lama apa yang belum kita tanggalkan? Apakah dalam perkataan kita sudah menjadi berkat untuk orang lain? Apakah kita telah sungguh-sungguh saling mengasihi dan mengampuni?

Selamat menjalani minggu ini teman2 Perki Aachen 👋God bless!$tldr$)
) AS i("day", "type", "keypoints", "tldr")
JOIN "schedules" s
  ON (s."date" AT TIME ZONE 'Europe/Berlin')::date = i."day"::date
 AND s."type" = i."type"::"event_type"
WHERE NOT EXISTS (SELECT 1 FROM "takeaways" t WHERE t."scheduleId" = s."id");
