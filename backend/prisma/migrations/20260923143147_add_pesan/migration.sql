-- CreateTable
CREATE TABLE "Pesan" (
    "id" UUID NOT NULL,
    "santriId" UUID NOT NULL,
    "senderUserId" UUID NOT NULL,
    "isi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pesan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pesan_santriId_createdAt_idx" ON "Pesan"("santriId", "createdAt");

-- AddForeignKey
ALTER TABLE "Pesan" ADD CONSTRAINT "Pesan_santriId_fkey" FOREIGN KEY ("santriId") REFERENCES "Santri"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesan" ADD CONSTRAINT "Pesan_senderUserId_fkey" FOREIGN KEY ("senderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
