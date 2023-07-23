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
            Lorem ipsum dolor sit amet consectetur adipisicing elit. Praesentium soluta minima cum
            perspiciatis exercitationem incidunt voluptatem dolorem sequi? Veniam placeat, quam,
            cupiditate, quisquam esse aliquam aliquid ab molestias ipsum architecto laborum
            accusamus suscipit natus impedit voluptate eum at id aperiam!
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
