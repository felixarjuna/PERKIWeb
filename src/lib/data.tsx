type Event = {
  name: string;
  time: string;
  notes: string;
  description: string | React.ReactNode;
};

export const events: Event[] = [
  {
    name: "Church Service / Big Group Bible Study",
    time: "Saturday, 15.30 - 17.00",
    notes:
      "Spending moments to listening to God words from another God's children.",
    description: (
      <div className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-lg">Church service</h2>
          <div className="space-y-2">
            <p>
              Perki church services are held twice a month - on Saturday of the
              second week by Pastor Titus Christianto and on the fourth week by
              Pastor John Kusuma. The service begins with a private quiet time,
              followed by singing hymns together accompanied by a piano. In the
              main part of the service, the serving pastor will expound on the
              Word of God. After the sermon, the congregation is given the
              opportunity to pray privately and respond to the Word. The service
              ends with the giving of offerings, intercessory prayer, sending
              out, quiet time and announcements.{" "}
            </p>

            <p>
              Every three months we hold Holy Communion at the end of the
              service. Everyone who has received the Lord Jesus as Savior and
              awaits His second coming by faith is welcome to partake. (1
              Corinthians 11:28).
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg">Big group bible study</h2>
          <p>
            Our Big Group Bible Study is a joint Bible Study activity held on
            the first, third and fifth week (if applicable) of each month. The
            service is led by the Fellowship Committee and the seating position
            is made around a large table. At the beginning of the service, the
            congregation is given the opportunity to choose a hymn to sing
            together or share their life experiences with God. Through this
            activity, fellowship members are expected to learn to witness, get
            to know each other more deeply and also love. After the word prayer,
            the caretaker on duty will lead the exposition of God&apos;s Word
            and the congregation is allowed to discuss or ask questions at the
            end of the reflection. The service then ends with prayer, offerings
            and announcements.
          </p>
        </div>
        <div>
          <p>
            After the worship service is over Perki organizes a meal together.
            The food is served by the group in charge of serving in cooking. And
            besides enjoying the meal, we also spend time together chatting.
          </p>
        </div>
      </div>
    ),
  },
  {
    name: "Small Group Bible Study",
    time: "Saturday, 13.00 - 15.00",
    notes:
      "Focusing our attention deeply on the truth that the Word of God has for us.",
    description:
      "Small Group Bible Study is a Bible Study group where members invite and are also invited and called and have a desire to know God and grow in God through discussion of certain themes. In this small PA group, we are also given the opportunity to be open to each other in sharing experiences gained with God or sharing struggles or difficulties that are being experienced. Because we also long to be closer and get to know each other better as a fellowship in God. (1 John 1:7).",
  },
  {
    name: "Prayer Fellowship (Aachen)",
    time: "Thursday, 18:30 - 21.00",
    notes:
      "Having the moments in the middle of our busy live to meditate about the Word of God together.",
    description:
      "In the midst of our busy schedules, we take time together to share what happened during the week and pray together, exchange advice, and provide support for those in need.",
  },
];

type Pastor = {
  name: string;
  favoriteVerse: string;
  img: string;
  story: string | React.ReactNode;
};

export const pastors: Pastor[] = [
  {
    name: "Pdt. John Kusuma",
    favoriteVerse: "All honor and glory be to the Lord Jesus Christ!",
    img: "/images/john.jpg",
    story:
      "John Kusuma was born in Banda Aceh and lived in Methodist Junior High School Banda Aceh until the age of 13, where he completed 1st grade. He then attended Methodist 2 Junior High School and Sutomo High School in Medan. In 1989-1999, he continued his studies in chemical engineering at the Technical University of Berlin. From 1999-2003, he continued his studies at SAAT Malang and did one year of practical service (2003-2004) at Abdiel Christian Church (GKA) Gracia, Surabaya. After that, he served as pastor of the church in the same place from 2004-2011. Since January 2012, he has been serving in Jemaat Kristen Immanuel Berlin (FeG Immanuel Berlin since Sept. 2015) as a pastor and was ordained as a pastor of FeG Immanuel Berlin by the FeG Synod on March 25, 2012.",
  },
  {
    name: "Pdt. Titus Christanto",
    favoriteVerse: "He who has Jesus has life.",
    img: "/images/titus.png",
    story:
      "Titus Christianto serves at PERKI Aachen every second week of the month. He began his ministry by entering the Southeast Asian Bible Seminary (SAAT). After his studies, he was sent to serve the Pasamuan Urip Anyar Suriname (PUAS) congregation in Pamaribo, Suriname. Here he began his commitment to expand the kingdom of God and in early 2015 he was called to an outreach ministry to the Indonesian Diaspora community in the city of Hamburg, Germany. After receiving his Bachelor of Theology (S.Th) he was ordained as a pastor for FeG Maranatha Hamburg on December 10, 2017.",
  },
  {
    name: "Ev. Riggruben",
    favoriteVerse:
      "My ministry is of Christ, belongs to Christ, and is for Christ alone. May God be glorified always through my life.",
    img: "/images/riggrubben.jpg",
    story:
      "When I accepted God's call as a full-time pastor, I had no idea at the time where I would serve. My prayer was more or less, lead me where God is calling me and give me an obedient heart and strength to live it. Four times I practiced ministry (assigned by SAAT) located in Eastern Indonesia, namely in Palu, Bali, Papua, and Makassar. But this year it feels like the direction of the wind of ministry has changed and pushed my ministry heart to the West. This is where I am anchored, at FeG Immanuel Berlin \n I completed my bachelor's degree in Theology at Southeast Asia Bible Seminary in 2019 and continued my post-graduate program in 2020. In my ministry practice, I served for one year at Kalam Kudus Church in Makassar. My ministry is also fully supported by my loving family. My father is a doctor and my mother is a teacher. I am the third of three children, where my older siblings also serve as doctors and servants of God. They also fully support my ministry in this place.",
  },
];

type Service = {
  title: string;
  description: string | React.ReactNode;
};

export const services: Service[] = [
  {
    title: "Church service",
    description: (
      <>
        <p>
          Perki services are held twice a month - on Saturday of the second week
          by Pastor Titus Christianto and on the fourth week by Pastor John
          Kusuma. The service begins with a private quiet time, followed by
          singing hymns together accompanied by a piano. In the main part of the
          service, the serving pastor will expound on the Word of God. After the
          sermon, the congregation is given the opportunity to pray privately
          and respond to the Word. The service ends with the giving of
          offerings, intercessory prayer, sending out, quiet time and
          announcements.
        </p>
        <p>
          Every three months we hold Holy Communion at the end of the service.
          Everyone who has received the Lord Jesus as Savior and awaits His
          second coming by faith is welcome to partake. (1 Corinthians 11:28).
        </p>
      </>
    ),
  },
  {
    title: "Big Group Bible Study",
    description: (
      <p>
        Big Group Bible Study is a joint Bible Study activity held on the first,
        third and fifth week (if applicable) of each month. The service is led
        by the Fellowship Committee and the seating position is made around a
        large table. At the beginning of the service, the congregation is given
        the opportunity to choose a hymn to sing together or share their life
        experiences with God. Through this activity, fellowship members are
        expected to learn to witness, get to know each other more deeply and
        also love. After the word prayer, the caretaker on duty will lead the
        exposition of God&apos;s Word and the congregation is allowed to discuss
        or ask questions at the end of the reflection. The service then ends
        with prayer, offerings and announcements.
      </p>
    ),
  },
  {
    title: "Small Group Bible Study",
    description: (
      <p>
        Small Group Bible Study is a Bible Study group where members invite and
        are also invited and called and have a desire to know God and grow in
        God through discussion of certain themes. In this small PA group, we are
        also given the opportunity to be open to each other in sharing
        experiences gained with God or sharing struggles or difficulties that
        are being experienced. Because we also long to be closer and get to know
        each other better as a fellowship in God. (1 John 1:7).
      </p>
    ),
  },
  {
    title: "Eating & Chatting",
    description: (
      <p>
        Every month Perki organizes a meal together twice, after the worship
        service is over. The food is served by the group in charge of serving in
        cooking. And besides enjoying the meal, we also spend time together
        chatting.
      </p>
    ),
  },
];

export const takeawayIds = [
  "church-service",
  "bg-bible-study",
  "sg-bible-study",
];

export const speakers = [
  "Oliver Renaldi",
  "Danny Kurniawan",
  "Billy Lugito",
  "Steffen Josua",
  "Clarissa Adelyne",
  "Arya Bangun",
  "Reggy Irawan",
  "Pdt. John Kusuma",
  "Pdt. Titus Christanto",
  "Ev. Nehemiah Riggruben",
  "Kevin Achwan",
].sort();

export const noteWriter = [
  "Lionel Erico",
  "Karyn Gaspersz",
  "Kezia Singgih",
  "Ruth Siahaan",
  "Tius Theodore",
  "Ido Manuel",
  "Victor Jordan",
].sort();

export const liturgos = [
  "Danny Kurniawan",
  "Toni Setiawan",
  "Sofian Oeij",
  "Jordie Yonathan",
  "Albertus Pandya",
  "Reggy Irawan",
  "Steffen Josua",
  "Winston A.",
  "Oliver Renaldi",
].sort();

export const musicians = [
  "Felix Arjuna",
  "Reggy Irawan",
  "Clarissa Adelyne",
  "Danny Kurniawan",
  "Albertus Pandya",
  "Jordie Yonathan",
  "Oliver Renaldi",
  "Wynnona A.",
  "Shane Arno",
].sort();

export const multimedia = [
  "Danny Kurniawan",
  "Arya Wisnu",
  "Reggy Irawan",
  "Jordie Yonathan",
  "Felix Arjuna",
  "Victor Jordan",
].sort();

export const accommodation = [
  "Oliver Renaldi",
  "Danny Kurniawan",
  "Jordie Yonathan",
  "Reggy Irawan",
  "Jansen Nathanel",
  "Albertus Pandya",
  "Ido Manuel",
].sort();

export const groups = [
  "Group 1",
  "Group 2",
  "Group 3",
  "Group 4",
  "Group 5",
  "Group 6",
].sort();
