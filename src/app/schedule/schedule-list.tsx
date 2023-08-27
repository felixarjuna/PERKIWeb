import { Bed, Music, PersonStanding, Sparkles, Utensils } from "lucide-react";

type Content = {
  title: string;
  date: string;
  speaker: string;
  bibleVerse: string;
  summary: string;
  liturgos?: string;
  musician?: string;
  multimedia?: string;
  accommodation?: string;
  cookingGroup?: string;
  cleaningGroup: string;
};

const contents: Content[] = [
  {
    title: "Sent to Bring Freedom",
    date: "Aug 12",
    speaker: "Pdt. Titus Christanto",
    bibleVerse: "John 8:31-36;56-59",
    summary:
      "Does becoming a Christian mean the end of your freedom? Is a relationship with Jesus Christ a radical challenge to your freedom? The answer is yes and no. But ultimately, no. That sounds like an ambiguous answer, but actually, it's a complex one.",
    liturgos: "Danny Kurniawan",
    musician: "Felix Arjuna",
    multimedia: "Jordie Yonathan",
    accommodation: "Aldi",
    cookingGroup: "Group 5",
    cleaningGroup: "Group 6",
  },
  {
    title: "Sent to Bear Witness",
    date: "Aug 5",
    speaker: "Steffen Josua",
    bibleVerse: "John 12:37-50",
    summary:
      "We learn from Jesus Christ's last public sermon to the world. And when you know that this is the end of everything, that you will never speak to another person again before you die, you usually say the things that are most important to you. There are three ideas that Jesus conveys in this passage. They are not easy messages for the world to hear, but they are brilliant.",
    liturgos: undefined,
    musician: undefined,
    multimedia: undefined,
    accommodation: undefined,
    cookingGroup: undefined,
    cleaningGroup: "Group 4",
  },
  {
    title: "Sent to show Christ's Glory",
    date: "July 29",
    speaker: "Danny Kurniawan",
    bibleVerse: "John 12:27-36",
    summary:
      "According to the Bible, there is nothing greater than the glory of God. But that term is so far away for us now. Most Christians have heard of doing things for the glory of God, but what does that mean? Do you want to have meaning in life? Do you have a need for deep personal change? Do you care about justice in the world? The key to all of those things is the glory of God.",
    liturgos: undefined,
    musician: undefined,
    multimedia: undefined,
    accommodation: undefined,
    cookingGroup: undefined,
    cleaningGroup: "Group 2",
  },
];

export default function ScheduleList() {
  return (
    <div className="mt-8 space-y-4 xs:mt-4">
      {contents.map((content, index) => {
        return (
          <div key={index} className="grid grid-cols-4 gap-x-4 gap-y-2">
            <div className="col-span-3 p-6 bg-green-default/60 rounded-lg w-full hover:bg-green-default/80 shadow-lg transition duration-300 cursor-pointer xs:col-span-4">
              <h1 className="text-2xl font-reimbrandt tracking-wide">{content.title}</h1>
              <div className="flex items-center gap-x-2 text-green-400/80 font-reimbrandt xs:text-xs xs:gap-x-1 xs:flex-wrap">
                <p>{content.speaker}</p>
                <span>&middot;</span>
                <p>{content.bibleVerse}</p>
                <span>&middot;</span>
                <p>{content.date}</p>
              </div>
              <p className="mt-4 xs:text-sm">{content.summary}</p>
            </div>
            <div className="col-span-1 bg-green-default/60 rounded-lg w-full p-6 space-y-2 flex flex-col justify-center hover:bg-green-default/80 shadow-lg transition duration-300 xs:col-span-4 xs:text-sm">
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <PersonStanding className="w-5 h-5" />
                </div>
                <p>{content.liturgos ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Music className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{content.musician ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Bed className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{content.accommodation ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Utensils className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{content.cookingGroup ?? "-"}</p>
              </div>
              <div className="flex gap-x-2 items-center">
                <div className="w-7 h-7 xs:w-6 xs:h-6 bg-green-default/60 rounded-lg p-1 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 xs:h-3 xs:w-3" />
                </div>
                <p>{content.cleaningGroup}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
