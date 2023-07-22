import Chen from "../images/Chen.png";
import Pandya from "../images/Pandya.png";
import Steffen from "../images/Steffen.png";

export default function OurPastors() {
  return (
    <div>
      <div className="bg-cream-default text-dark-green-default font-founders">
        <div className="flex items-center gap-x-40">
          <div className="-ml-16 -rotate-90 whitespace-nowrap h-fit">
            <h1 className="text-5xl text-dark-green-default">Our Pastors</h1>
            <div className="h-[2px] bg-dark-green-default"></div>
          </div>

          <div className="flex flex-col">
            <div className="flex flex-row my-5">
              <p className="text-2xl max-w-lg text-justify mr-20">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Architecto consequuntur
                cupiditate accusantium necessitatibus modi delectus saepe magni id facilis adipisci,
                quas doloremque beatae provident, nesciunt veniam distinctio laudantium velit animi.
              </p>
              <img src={Chen} alt="Chen" className="rotate-3" />
            </div>

            <div className="flex flex-row my-5">
              <p className="text-2xl max-w-lg text-justify mr-20">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Architecto consequuntur
                cupiditate accusantium necessitatibus modi delectus saepe magni id facilis adipisci,
                quas doloremque beatae provident, nesciunt veniam distinctio laudantium velit animi.
              </p>
              <img src={Steffen} alt="Steffen" className="rotate-3" />
            </div>

            <div className="flex flex-row my-5">
              <p className="text-2xl max-w-lg text-justify mr-20">
                Lorem ipsum dolor sit, amet consectetur adipisicing elit. Architecto consequuntur
                cupiditate accusantium necessitatibus modi delectus saepe magni id facilis adipisci,
                quas doloremque beatae provident, nesciunt veniam distinctio laudantium velit animi.
              </p>
              <img src={Pandya} alt="Pandya" className="rotate-3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}