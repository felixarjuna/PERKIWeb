export const VisionAndMission = () => {
  return (
    <div className="pb-14">
      <div className="h-[1px] opacity-10 w-screen bg-light-green-default mb-10"></div>
      <div className="flex flex-row justify-center items-center gap-2 p-12">
        {/* <div className="h-[1px] w-24 bg-light-green-default"></div> */}
        <h1 className="text-7xl font-reimbrandt">Make Disciples of All Nations</h1>
        {/* <div className="h-[1px] w-24 bg-light-green-default"></div> */}
      </div>
      <div className="flex flex-row justify-center text-center gap-10">
        <div className="bg-green-default rounded-lg">
          <div className="flex flex-col gap-5 justify-center items-center p-12 max-w-xl">
            <h1 className="text-5xl ">Vision</h1>
            <p className="text-2xl">
              Become a church based on the Full Gospel to take root, grow and bear fruit for Christ.
            </p>
          </div>
        </div>
        <div className="bg-green-default rounded-lg">
          <div className="flex flex-col gap-5 justify-center items-center p-12 max-w-xl">
            <h1 className="text-5xl">Mission</h1>
            <p className="text-2xl">
              Building a Christian family that loves and serves God and people.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
