export default function Welcome() {
  return (
    <div className="bg-dark-green-default">
      <div className="flex h-screen flex-col items-center justify-center gap-5 text-light-green-default">
        <div className="-mt-20 flex flex-col gap-y-2 text-center">
          <h3 className="text-base uppercase xl:text-4xl 2xl:text-4xl">
            Welcome to our fellowship
          </h3>
          <h1 className="font-reimbrandt text-[14vw]">Perki Aachen</h1>
          <div className="flex justify-between gap-4 text-sm sm:gap-20">
            <div className="flex items-center gap-2 uppercase xl:text-4xl 2xl:text-4xl">
              <p>since 1990</p>
            </div>
            <div className="uppercase xl:text-4xl 2xl:text-4xl">
              Non-denominational
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
