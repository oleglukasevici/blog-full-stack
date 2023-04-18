import { createRouter } from "@server/createRouter";
import {
  formatComments,
  markdownToHtml,
  isLoggedInMiddleware,
  deleteChildComments,
  getFiltersByInput,
} from "@server/utils";
import * as trpc from "@trpc/server";
import { isStringEmpty } from "@utils/checkEmpty";
import {
  createCommentSchema,
  deleteCommentSchema,
  getCommentsSchema,
  getUserCommentsSchema,
  updateCommentSchema,
} from "@schema/comment.schema";

export const commentRouter = createRouter()
  .query("user-comments", {
    input: getUserCommentsSchema,
    async resolve({ ctx, input }) {
      const { userId, limit, skip, cursor } = input;

      try {
        const comments = await ctx.prisma.comment.findMany({
          take: limit + 1,
          skip: skip,
          cursor: cursor ? { id: cursor } : undefined,
          where: {
            userId,
          },
          include: {
            user: true,
            Post: {
              select: {
                userId: true,
                title: true,
              },
            },
          },
          ...(input?.filter
            ? { orderBy: getFiltersByInput(input?.filter, true) }
            : {
                orderBy: {
                  createdAt: "desc",
                },
              }),
        });

        let nextCursor: typeof cursor | undefined = undefined;
        if (comments.length > limit) {
          const nextItem = comments.pop(); // return the last item from the array
          nextCursor = nextItem?.id;
        }

        const withFormattedBody = await Promise.all(
          comments.map(async (comment) => {
            const formattedBody = await markdownToHtml(comment?.body || "", {
              removeLinksAndImages: false,
              truncate: false,
              linkifyImages: true,
            });

            return {
              ...comment,
              body: formattedBody,
              markdownBody: comment.body,
              authorIsOP: comment?.Post?.userId === comment?.userId,
              children: [],
            };
          })
        );

        return { comments: withFormattedBody, nextCursor };
      } catch (e) {
        console.log("e:", e);
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    },
  })
  .query("all-comments", {
    input: getCommentsSchema,
    async resolve({ ctx, input }) {
      const { postId } = input;

      try {
        const comments = await ctx.prisma.comment.findMany({
          where: {
            Post: {
              id: postId,
            },
          },
          include: {
            user: true,
            Post: {
              select: {
                userId: true,
                title: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        const withFormattedBody = await Promise.all(
          comments.map(async (comment) => {
            const formattedBody = await markdownToHtml(comment?.body || "", {
              removeLinksAndImages: false,
              truncate: false,
              linkifyImages: true,
            });

            return {
              ...comment,
              body: formattedBody,
              // By also sendind the markdown body, we avoid having to
              // parse html back to MD when needed.
              markdownBody: comment?.body,
              authorIsOP: comment?.Post?.userId === comment?.userId,
            };
          })
        );

        type CommentType = typeof withFormattedBody[0];
        const withChildren = formatComments<CommentType>(withFormattedBody);

        return withChildren;
      } catch (e) {
        console.log("e:", e);
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    },
  })
  .middleware(isLoggedInMiddleware)
  .mutation("add-comment", {
    input: createCommentSchema,
    async resolve({ ctx, input }) {
      const { body, postId, parentId } = input;

      const { session } = ctx;

      if (isStringEmpty(body)) {
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
          message: "Comment can't be empty",
        });
      }

      try {
        const comment = await ctx.prisma.comment.create({
          data: {
            body,
            Post: {
              connect: {
                id: postId,
              },
            },
            user: {
              connect: {
                id: session?.user?.id,
              },
            },
            ...(parentId && {
              parent: {
                connect: {
                  id: parentId,
                },
              },
            }),
          },
        });

        return comment;
      } catch (e) {
        console.log(e);

        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    },
  })
  .mutation("delete-comment", {
    input: deleteCommentSchema,
    async resolve({ ctx, input }) {
      try {
        const { commentId } = input;

        const previousComment = await ctx.prisma.comment.findFirst({
          where: {
            id: commentId,
          },
        });

        if (previousComment?.userId !== ctx.session.user.id) {
          throw new trpc.TRPCError({
            code: "UNAUTHORIZED",
            message: "Cannot delete another user's comment",
          });
        }

        await deleteChildComments(commentId, ctx.prisma);

        return true;
      } catch (e) {
        console.log(e);

        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
        });
      }
    },
  })
  .mutation("update-comment", {
    input: updateCommentSchema,
    async resolve({ ctx, input }) {
      if (isStringEmpty(input.body)) {
        throw new trpc.TRPCError({
          code: "BAD_REQUEST",
          message: "Comment cannot be empty",
        });
      }

      const previousComment = await ctx.prisma.comment.findFirst({
        where: {
          id: input.commentId,
        },
      });

      if (previousComment?.userId !== ctx.session.user.id) {
        throw new trpc.TRPCError({
          code: "UNAUTHORIZED",
          message: "You can only update comments created by you.",
        });
      }

      const comment = await ctx.prisma.comment.update({
        where: {
          id: input.commentId,
        },
        data: {
          ...(input.body && {
            body: input.body,
          }),
        },
      });

      return comment;
    },
  });
