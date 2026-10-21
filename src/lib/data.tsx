interface Event {
  description: string | React.ReactNode;
  name: string;
  notes: string;
  time: string;
}

/** Permanent invite to the PERKI Aachen Discord server (perki.bot posts birthdays there). */
export const DISCORD_INVITE_URL = "https://discord.gg/4hf5yWFfVP";

export const events: Event[] = [
  {
    description: (
      <div className="space-y-4">
        <p>
          Church services are held twice a month, on the second and fourth
          Saturday. The service begins with a private quiet time, followed by
          hymns sung together to the piano. The pastor leading the service
          expounds the Word of God. After the sermon everyone is given time to
          pray privately and respond to the Word. The service ends with the
          offering, intercessory prayer, the sending out, a quiet time and
          announcements.
        </p>
        <p>
          Every three months we celebrate Holy Communion at the end of the
          service. Everyone who has received the Lord Jesus as Saviour and
          awaits His second coming by faith is welcome to partake (1 Corinthians
          11:28).
        </p>
        <p>
          After the service we eat together. The food is prepared by the group
          on cooking duty, and the meal is where most of the catching up
          happens.
        </p>
      </div>
    ),
    name: "Church Service",
    notes:
      "Second and fourth Saturday of the month. Worship, a sermon and time to respond to the Word, followed by a meal together.",
    time: "Saturday, 15:30–17:00",
  },
  {
    description: (
      <div className="space-y-4">
        <p>
          On the first, third and, where there is one, fifth Saturday of the
          month we study the Bible together as one big group, led by the
          fellowship committee and seated around a large table. We open by
          choosing hymns to sing together or sharing what God has been doing in
          our lives. Through this we learn to witness, to know each other more
          deeply and to love one another.
        </p>
        <p>
          After the opening prayer the member on duty leads the exposition of
          the Word, and everyone is welcome to discuss or ask questions at the
          end. We close with prayer, the offering and announcements, then eat
          together.
        </p>
      </div>
    ),
    name: "Big Group Bible Study",
    notes:
      "First, third and fifth Saturday of the month. One big table, hymns, a shared reading of the Word and open discussion.",
    time: "Saturday, 15:30–17:00",
  },
  {
    description:
      "Small Group Bible Study is a Bible Study group where members invite and are also invited and called and have a desire to know God and grow in God through discussion of certain themes. In this small PA group, we are also given the opportunity to be open to each other in sharing experiences gained with God or sharing struggles or difficulties that are being experienced. Because we also long to be closer and get to know each other better as a fellowship in God. (1 John 1:7).",
    name: "Small Group Bible Study",
    notes:
      "Focusing our attention deeply on the truth that the Word of God has for us.",
    time: "Saturday, 13:00–15:00",
  },
  {
    description:
      "In the midst of our busy schedules, we take time together to share what happened during the week and pray together, exchange advice, and provide support for those in need.",
    name: "Prayer Fellowship (Aachen)",
    notes:
      "A pause in a busy week to share, pray for one another and sit with the Word together.",
    time: "Thursday, 18:00–21:00",
  },
];

interface Service {
  description: string | React.ReactNode;
  title: string;
}

export const services: Service[] = [
  {
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
    title: "Church service",
  },
  {
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
    title: "Big Group Bible Study",
  },
  {
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
    title: "Small Group Bible Study",
  },
  {
    description: (
      <p>
        Every month Perki organizes a meal together twice, after the worship
        service is over. The food is served by the group in charge of serving in
        cooking. And besides enjoying the meal, we also spend time together
        chatting.
      </p>
    ),
    title: "Eating & Chatting",
  },
];

export const takeawayIds = [
  "church-service",
  "bg-bible-study",
  "sg-bible-study",
];

export const noteWriter = [
  "Lionel Erico",
  "Karyn Gaspersz",
  "Kezia Singgih",
  "Ruth Siahaan",
  "Tius Theodore",
  "Ido Manuel",
  "Victor Jordan",
  "Serviano",
  "Winston Alexander",
].sort();

export const liturgos = [
  "Danny Kurniawan",
  "Toni Setiawan",
  "Sofian Oeij",
  "Jordie Yonathan",
  "Albertus Pandya",
  "Reggy Irawan",
  "Steffen Tjandra",
  "Winston Alexander",
  "Oliver Renaldi",
  "Billy Christian",
  "Wynnona Angelica",
  "Shane Pangestu",
  "Ido Manuel",
  "Victor Jordan",
  "Jericho Oland Marsahala",
].sort();

export const musicians = [
  "Felix Arjuna",
  "Reggy Irawan",
  "Clarissa Adelyne",
  "Danny Kurniawan",
  "Albertus Pandya",
  "Jordie Yonathan",
  "Oliver Renaldi",
  "Wynnona Angelica",
  "Shane Pangestu",
  "Ido Manuel",
  "Steffen Tjandra",
  "Tius Theodore",
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
