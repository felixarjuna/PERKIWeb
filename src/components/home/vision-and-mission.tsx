export default function VisionAndMission() {
  return (
    <div className="pb-4 2xl:pb-14">
      <div className="flex flex-row items-center justify-center gap-2 p-4 2xl:p-12">
        <h1 className="px-8 text-center font-reimbrandt text-3xl 2xl:text-7xl">
          Make Disciples of All Nations
        </h1>
      </div>
      <div className="mx-auto flex w-72 flex-col items-center justify-center gap-4 text-center 2xl:flex-row 2xl:gap-10">
        <div className="rounded-lg bg-green-default">
          <div className="flex max-w-xl flex-col items-center justify-center gap-2 p-6 2xl:gap-5 2xl:p-12">
            <h1 className="font-reimbrandt text-2xl sm:text-5xl">Vision</h1>
            <p className="text-base sm:text-2xl">
              Become a church based on the Full Gospel to take root, grow and
              bear fruit for Christ.
            </p>
          </div>
        </div>
        <div className="rounded-lg bg-green-default">
          <div className="flex max-w-xl flex-col items-center justify-center gap-2 p-6 sm:gap-5 sm:p-12">
            <h1 className="font-reimbrandt text-2xl sm:text-5xl">Mission</h1>
            <p className="text-base sm:text-2xl">
              Building a Christian family that loves and serves God and people.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
