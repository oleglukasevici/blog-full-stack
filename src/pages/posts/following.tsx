import AnimatedTabs from "@components/AnimatedTabs";
import EmptyMessage from "@components/EmptyMessage";
import MetaTags from "@components/MetaTags";
import PostCard from "@components/PostCard";
import ShouldRender from "@components/ShouldRender";
import useFilterContent from "@hooks/useFilterContent";
import useOnScreen from "@hooks/useOnScreen";
import { authOptions } from "@pages/api/auth/[...nextauth]";
import { trpc } from "@utils/trpc";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth";
import { useEffect, useMemo, useRef } from "react";

const Following = () => {
  const { tabProps, selectedTab } = useFilterContent();

  const bottomRef = useRef<HTMLDivElement>(null);
  const reachedBottom = useOnScreen(bottomRef);

  const { data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage } =
    trpc.useInfiniteQuery(
      [
        "posts.following-posts",
        {
          limit: 6,
          filter: selectedTab.id,
        },
      ],
      {
        getNextPageParam: (lastPage) => lastPage?.nextCursor,
      }
    );

  const dataToShow = useMemo(
    () => data?.pages.flatMap((page) => page?.posts),
    [data]
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
      <MetaTags title="Following" />
      <div className="w-full">
        <h2 className="prose text-2xl font-bold dark:prose-invert xl:text-3xl">
          Posts from your following
        </h2>
        <div className="mt-3 flex gap-3">
          <AnimatedTabs {...tabProps} />
        </div>
      </div>
      <div className="w-ful -mt-3 flex flex-col gap-10">
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

        <ShouldRender if={noDataToShow}>
          <EmptyMessage
            message="Hmm. Could not find any posts from your following."
            hideRedirect
            small
          />
        </ShouldRender>

        <div ref={bottomRef} />
      </div>
    </>
  );
};

export default Following;

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user) {
    return { redirect: { destination: "/" } };
  }

  return {
    props: {},
  };
}
