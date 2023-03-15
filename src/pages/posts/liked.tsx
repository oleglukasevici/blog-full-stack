import React, { useEffect, useMemo, useRef, useState } from "react";
import MainLayout from "@components/MainLayout";
import MetaTags from "@components/MetaTags";
import { authOptions } from "@pages/api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { trpc } from "@utils/trpc";
import useOnScreen from "@hooks/useOnScreen";
import PostCard from "@components/PostCard";
import ShouldRender from "@components/ShouldRender";
import EmptyMessage from "@components/EmptyMessage";
import SearchInput from "@components/SearchInput";

const UserLikedPage: React.FC = () => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const reachedBottom = useOnScreen(bottomRef);
  const [queryValue, setQueryValue] = useState("");

  const {
    data: posts,
    isLoading,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
  } = trpc.useInfiniteQuery(
    [
      "posts.get-liked-posts",
      {
        limit: 6,
        query: queryValue,
      },
    ],
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const dataToShow = useMemo(
    () => posts?.pages.flatMap((page) => page.posts),
    [posts]
  );

  const loadingArray = Array.from<undefined>({ length: 4 });
  const noDataToShow = !isLoading && !dataToShow?.length && !hasNextPage;

  useEffect(() => {
    if (reachedBottom && hasNextPage) {
      fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reachedBottom]);
  return (
    <>
      <MetaTags title="Liked posts" />
      <MainLayout>
        <div className="-mb-5 w-full">
          <h1 className="sm:text-3xl mb-2 text-2xl prose dark:prose-invert font-bold w-full text-left">
            Your likes
          </h1>
          <SearchInput
            placeholder="Search your liked posts"
            setQuery={setQueryValue}
          />
        </div>
        {(isLoading ? loadingArray : dataToShow)?.map((post, i) => (
          <PostCard
            key={isLoading ? i : post?.id}
            post={post}
            loading={isLoading}
          />
        ))}

        <ShouldRender if={isFetchingNextPage}>
          <PostCard loading />
        </ShouldRender>

        <div ref={bottomRef} />

        <ShouldRender if={noDataToShow}>
          <EmptyMessage
            message={
              !!queryValue
                ? "Hmm. No posts found."
                : "You have not liked any posts yet."
            }
            redirect="/"
            redirectMessage="Back to home"
            hideRedirect={!!queryValue}
          />
        </ShouldRender>
      </MainLayout>
    </>
  );
};

export default UserLikedPage;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/" } };
  }

  return {
    props: {},
  };
}