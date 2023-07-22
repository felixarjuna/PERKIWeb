import Perki from "../images/S__3186691.jpg";

export default function Home() {
  return (
    <div>
      <img src={Perki} alt="perki" />
      <div className="bg-cream-default text-dark-green-default font-founders">
        <div className="flex items-center gap-x-40">
          <div className="-ml-16 -rotate-90 whitespace-nowrap h-fit">
            <h1 className="text-5xl text-dark-green-default">What We Do?</h1>
            <div className="h-[2px] bg-dark-green-default"></div>
          </div>

          <div className="grid grid-cols-2 gap-28 py-14">
            <div className="max-w-xl">
              <h1 className="text-4xl">Church Service / Big Group Bible Study</h1>
              <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div>
              <h2 className="text-3xl">Saturday, 15.30 - 17.00 </h2>
              <p className="text-xl">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repudiandae architecto
                delectus neque suscipit cum, consequatur eos cupiditate voluptates aliquam. Ipsum
                cum officiis delectus recusandae molestiae obcaecati fugiat. Dolorem, atque
                recusandae!
              </p>
            </div>
            <div className="max-w-xl">
              <h1 className="text-4xl">Small Group Bible Study</h1>
              <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div>
              <h2 className="text-3xl">Saturday, 13.00 - 15.00 </h2>
              <p className="text-xl">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repudiandae architecto
                delectus neque suscipit cum, consequatur eos cupiditate voluptates aliquam. Ipsum
                cum officiis delectus recusandae molestiae obcaecati fugiat. Dolorem, atque
                recusandae!
              </p>
            </div>
            <div className="max-w-xl">
              <h1 className="text-4xl">Prayer Fellowship (Aachen)</h1>
              <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div>
              <h2 className="text-3xl">Thursday, 19.00 - 21.00 </h2>
              <p className="text-xl">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repudiandae architecto
                delectus neque suscipit cum, consequatur eos cupiditate voluptates aliquam. Ipsum
                cum officiis delectus recusandae molestiae obcaecati fugiat. Dolorem, atque
                recusandae!
              </p>
            </div>
            <div className="max-w-xl">
              <h1 className="text-4xl">Prayer Fellowship (Jülich)</h1>
              <div className="h-[2px] w-[312px] bg-dark-green-default -translate-y-1"></div>
              <h2 className="text-3xl">Friday, 18.30 - 21.00 </h2>
              <p className="text-xl">
                Lorem ipsum dolor sit amet, consectetur adipisicing elit. Repudiandae architecto
                delectus neque suscipit cum, consequatur eos cupiditate voluptates aliquam. Ipsum
                cum officiis delectus recusandae molestiae obcaecati fugiat. Dolorem, atque
                recusandae!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
