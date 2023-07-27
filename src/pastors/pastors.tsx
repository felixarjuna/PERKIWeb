import { useNavigate } from "react-router-dom";

export const Pastors = () => {
  const navigate = useNavigate();

  return (
    <section className="bg-cream-default text-dark-green-default pb-40">
      <div className="px-24">
        <div className="flex items-center justify-center gap-8 py-16 ">
          <h1 className="text-9xl">Pastors</h1>
          {/* <Separator className="h-1 rounded-sm" /> */}
        </div>
      </div>

      <div className="px-44 space-y-10 flex flex-col">
        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Pdt. John Kusuma</h1>
          <p>
            John Kusuma was born and until the age of 13 lived in Banda Aceh until junior high
            school grade 1 Methodist Junior High School Banda Aceh. Then completed his junior high
            school education at Methodist 2 Junior High School and Sutomo High School in Medan.
            After that, he continued his studies majoring in Chemical Engineering at TU Berlin from
            1989 -1999. From 1999-2003 he continued his studies at SAAT Malang and 1 year of
            practical service (2003-2004) at Abdiel Christian Church (GKA) Gracia, Surabaya. After
            that from 2004-2011 served as Pastor of the Session in the same place. Since January
            2012, he has been serving at Jemaat Kristen Immanuel Berlin (since Sept 2015 FeG
            Immanuel Berlin) as a Pastor and was ordained on March 25, 2012 by the FeG synod as
            Pastor of FeG Immanuel Berlin.
          </p>
        </div>

        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Pdt. Titus Christanto</h1>
          <p>
            Titus Christianto serves at PERKI Aachen every second week of the month. He began his
            ministry by entering the Southeast Asian Bible Seminary (SAAT). After his studies, he
            was sent to serve the Pasamuan Urip Anyar Suriname (PUAS) congregation in Pamaribo,
            Suriname. Here he began his commitment to expand the kingdom of God and in early 2015 he
            was called to an outreach ministry to the Indonesian Diaspora community in the city of
            Hamburg, Germany. After receiving his Bachelor of Theology (S.Th) he was ordained as a
            pastor for FeG Maranatha Hamburg on December 10, 2017.
          </p>
        </div>

        <div className="text-2xl space-y-4">
          <h1 className="text-6xl">Ev. Riggruben</h1>
          <p>
            "When I accepted God's call as a full-time pastor, I had no idea at the time where I
            would serve. My prayer was more or less, lead me where God is calling me and give me an
            obedient heart and strength to live it. Four times I practiced ministry (assigned by
            SAAT) located in Eastern Indonesia, namely in Palu, Bali, Papua, and Makassar. But this
            year it feels like the direction of the wind of ministry has changed and pushed my
            ministry heart to the West. This is where I am anchored, at FeG Immanuel Berlin".
          </p>
          <p>
            "I completed my bachelor's degree in Theology at Southeast Asia Bible Seminary in 2019
            and continued my post-graduate program in 2020. In my ministry practice, I served for
            one year at Kalam Kudus Church in Makassar. My ministry is also fully supported by my
            loving family. My father is a doctor and my mother is a teacher. I am the third of three
            children, where my older siblings also serve as doctors and servants of God. They also
            fully support my ministry in this place"
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
