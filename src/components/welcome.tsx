export default function Welcome() {
  return (
    <div className="bg-dark-green-default">
      <div className="flex h-screen flex-col items-center justify-center gap-5 text-light-green-default">
        <div className="-mt-20 flex flex-col gap-y-2 text-center">
          <h3 className="uppercase xl:text-4xl 2xl:text-4xl xs:text-[19px]">
            Welcome to our fellowship
          </h3>
          <h1 className="font-reimbrandt text-[14vw]">Perki Aachen</h1>
          <div className="flex gap-20 xs:gap-4">
            <div className="flex items-center gap-2 uppercase xl:text-4xl 2xl:text-4xl xs:text-[0.8rem]">
              <p>since</p>
              <div className="h-[0.1vw] w-[7vw] bg-light-green-default"></div>
              <p>1990</p>
            </div>
            <div className="uppercase xl:text-4xl 2xl:text-4xl xs:text-[0.8rem]">
              Non-denominational church
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
