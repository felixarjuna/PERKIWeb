import { useNavigate } from "react-router-dom";

export const Activity = () => {
  const navigate = useNavigate();
  return (
    <section className="bg-cream-default text-dark-green-default pb-40">
      <div className="px-24">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="text-9xl">Activities</h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="px-44 space-y-10 flex flex-col">
        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Church service</h1>
          <p>
            Perki services are held twice a month - on Saturday of the second week by Pastor Titus
            Christianto and on the fourth week by Pastor John Kusuma. The service begins with a
            private quiet time, followed by singing hymns together accompanied by a piano. In the
            main part of the service, the serving pastor will expound on the Word of God. After the
            sermon, the congregation is given the opportunity to pray privately and respond to the
            Word. The service ends with the giving of offerings, intercessory prayer, sending out,
            quiet time and announcements.
          </p>
          <p>
            Every three months we hold Holy Communion at the end of the service. Everyone who has
            received the Lord Jesus as Savior and awaits His second coming by faith is welcome to
            partake. (1 Corinthians 11:28).
          </p>
        </div>

        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Big Group Bible Study</h1>
          <p>
            Big Group Bible Study is a joint Bible Study activity held on the first, third and fifth
            week (if applicable) of each month. The service is led by the Fellowship Committee and
            the seating position is made around a large table. At the beginning of the service, the
            congregation is given the opportunity to choose a hymn to sing together or share their
            life experiences with God. Through this activity, fellowship members are expected to
            learn to witness, get to know each other more deeply and also love. After the word
            prayer, the caretaker on duty will lead the exposition of God's Word and the
            congregation is allowed to discuss or ask questions at the end of the reflection. The
            service then ends with prayer, offerings and announcements.
          </p>
        </div>

        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Small Group Bible Study</h1>
          <p>
            Small Group Bible Study is a Bible Study group where members invite and are also invited
            and called and have a desire to know God and grow in God through discussion of certain
            themes. In this small PA group, we are also given the opportunity to be open to each
            other in sharing experiences gained with God or sharing struggles or difficulties that
            are being experienced. Because we also long to be closer and get to know each other
            better as a fellowship in God. (1 John 1:7).
          </p>
        </div>

        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Eating & Chatting</h1>
          <p>
            Every month Perki organizes a meal together twice, after the worship service is over.
            The food is served by the group in charge of serving in cooking. And besides enjoying
            the meal, we also spend time together chatting.
          </p>
        </div>

        <div
          className="bg-dark-green-default w-fit px-6 py-3 text-cream-default rounded-lg cursor-pointer self-end"
          onClick={() => navigate("/")}
        >
          Home
        </div>
      </div>
    </section>
  );
};
