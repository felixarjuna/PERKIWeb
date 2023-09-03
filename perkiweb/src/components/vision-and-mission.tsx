export default function VisionAndMission() {
  return (
    <div className="pb-14 xs:pb-4">
      <div className="h-[1px] opacity-10 w-screen bg-light-green-default mb-10"></div>
      <div className="flex flex-row justify-center items-center gap-2 p-12 xs:p-4">
        {/* <div className="h-[1px] w-24 bg-light-green-default"></div> */}
        <h1 className="xs:text-3xl text-7xl font-reimbrandt px-8 text-center">
          Make Disciples of All Nations
        </h1>
        {/* <div className="h-[1px] w-24 bg-light-green-default"></div> */}
      </div>
      <div className="flex flex-row justify-center items-center text-center gap-10 xs:flex-col xs:w-72 xs:mx-auto xs:gap-4">
        <div className="bg-green-default rounded-lg">
          <div className="flex flex-col gap-5 justify-center items-center p-12 max-w-xl xs:p-6 xs:gap-2">
            <h1 className="xs:text-2xl text-5xl font-reimbrandt">Vision</h1>
            <p className="xs:text-base text-2xl">
              Become a church based on the Full Gospel to take root, grow and bear fruit for Christ.
            </p>
          </div>
        </div>
        <div className="bg-green-default rounded-lg">
          <div className="flex flex-col gap-5 justify-center items-center p-12 max-w-xl xs:p-6 xs:gap-2">
            <h1 className="xs:text-2xl text-5xl font-reimbrandt">Mission</h1>
            <p className="xs:text-base text-2xl">
              Building a Christian family that loves and serves God and people.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
