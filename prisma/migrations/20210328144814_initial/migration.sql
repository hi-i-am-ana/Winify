-- CreateTable
CREATE TABLE "User" (
    "userId" SERIAL NOT NULL,
    "stravaUserId" INTEGER NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "lastname" VARCHAR(50) NOT NULL,
    "firstname" VARCHAR(50) NOT NULL,
    "password" CHAR(60) NOT NULL,
    "active" BOOLEAN NOT NULL,

    PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Activity" (
    "activityId" SERIAL NOT NULL,
    "stravaActivityId" INTEGER NOT NULL,
    "stravaUserId" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "movingTime" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "start_date_local" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,

    PRIMARY KEY ("activityId")
);

-- CreateTable
CREATE TABLE "EmailHash" (
    "hashId" SERIAL NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "hash" CHAR(60) NOT NULL,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("hashId")
);

-- CreateTable
CREATE TABLE "PasswordHash" (
    "hashId" SERIAL NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "hash" CHAR(60) NOT NULL,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("hashId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User.stravaUserId_unique" ON "User"("stravaUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User.email_unique" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "EmailHash.email_unique" ON "EmailHash"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordHash.email_unique" ON "PasswordHash"("email");

-- AddForeignKey
ALTER TABLE "Activity" ADD FOREIGN KEY ("stravaUserId") REFERENCES "User"("stravaUserId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailHash" ADD FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordHash" ADD FOREIGN KEY ("email") REFERENCES "User"("email") ON DELETE CASCADE ON UPDATE CASCADE;
