import * as trpc from "@trpc/server";
import { createRouter } from "@server/createRouter";
import {
  createPresignedUrlSchema,
  getPostAttachments,
  createPresignedAvatarUrlSchema,
  createPresignedPostBodyUrlSchema,
} from "@schema/attachment.schema";
import {
  BUCKET_NAME,
  s3,
  UPLOAD_MAX_FILE_SIZE,
  UPLOADING_TIME_LIMIT,
} from "src/config/aws";
import { isLoggedInMiddleware } from "@server/utils/isLoggedInMiddleware";
import { AttachmentMetadata } from "@utils/types";

export const attachmentsRouter = createRouter()
  .query("get-post-attachments", {
    input: getPostAttachments,
    async resolve({ ctx, input }) {
      const { postId } = input;

      const attachments = await ctx.prisma.attachment.findMany({
        where: {
          postId,
        },
      });

      const extendedFiles: AttachmentMetadata[] = await Promise.all(
        attachments.map(async (file) => {
          return {
            ...file,
            url: await s3.getSignedUrlPromise("getObject", {
              Bucket: BUCKET_NAME,
              Key: `${postId}/${file.id}`,
              ResponseContentDisposition: `attachment; filename ="${file.name}"`,
            }),
          };
        })
      );

      return extendedFiles;
    },
  })
  .middleware(isLoggedInMiddleware)
  .mutation("create-presigned-url", {
    input: createPresignedUrlSchema,
    async resolve({ ctx, input }) {
      const { postId, name, type } = input;

      const attachment = await ctx.prisma.attachment.create({
        data: {
          postId,
          name,
          type,
        },
      });

      try {
        const { url, fields } = await s3.createPresignedPost({
          Fields: {
            key: `${postId}/${attachment.id}`,
          },
          Conditions: [
            ["starts-with", "$Content-Type", ""],
            ["content-length-range", 0, UPLOAD_MAX_FILE_SIZE],
          ],
          Expires: UPLOADING_TIME_LIMIT,
          Bucket: BUCKET_NAME,
        });

        return { url, fields };
      } catch (e) {
        console.log("e:", e);
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
          message: "Error creating S3 presigned url",
        });
      }
    },
  })
  .mutation("create-presigned-avatar-url", {
    input: createPresignedAvatarUrlSchema,
    async resolve({ ctx, input }) {
      const { userId } = input;
      try {
        const { url, fields } = await s3.createPresignedPost({
          Bucket: process.env.AWS_S3_AVATARS_BUCKET_NAME,
          Fields: {
            key: userId,
          },
          Expires: UPLOADING_TIME_LIMIT,
          Conditions: [
            ["starts-with", "$Content-Type", "image/"],
            ["content-length-range", 0, UPLOAD_MAX_FILE_SIZE],
          ],
        });

        return { url, fields };
      } catch (e) {
        console.log("e:", e);
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
          message: "Error creating S3 presigned avatar url",
        });
      }
    },
  })
  .mutation("create-presigned-post-body-url", {
    input: createPresignedPostBodyUrlSchema,
    async resolve({ ctx, input }) {
      const { userId, randomKey } = input;

      try {
        const { url, fields } = await s3.createPresignedPost({
          Bucket: process.env.NEXT_PUBLIC_AWS_S3_POST_BODY_BUCKET_NAME,
          Fields: {
            key: `${userId}-${randomKey}`,
          },
          Expires: UPLOADING_TIME_LIMIT,
          Conditions: [
            ["starts-with", "$Content-Type", "image/"],
            ["content-length-range", 0, UPLOAD_MAX_FILE_SIZE],
          ],
        });

        return { url, fields };
      } catch (e) {
        console.log("e:", e);
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
          message: "Error creating S3 presigned post body url",
        });
      }
    },
  });
