import ReactMarkdown from "@components/ReactMarkdown";
import getUserDisplayName from "@utils/getUserDisplayName";
import { PostFromList } from "@utils/types";
import Link from "next/link";
import LikeCount from "./LikeCount";
import LinkPreview from "./LinkPreview";
import ShouldRender from "./ShouldRender";
import Skeleton from "./Skeleton";
import TagList from "./TagList";

type Props = {
  loading: boolean;
  post?: PostFromList;
};

const PostCard: React.FC<Props> = ({ post, loading }) => {
  return (
    <article
      className={`relative bg-slate-100 dark:bg-zinc-800 shadow-md w-full px-10 py-5 flex flex-col justify-center gap-5 cursor-pointer hover:opacity-80 dark:hover:brightness-105 dark:hover:opacity-100 transition-all ${
        loading ? "pointer-events-none" : ""
      }`}
    >
      <ShouldRender if={post?.link}>
        <LinkPreview data={post?.link} loading={loading} disableImagePreview />
      </ShouldRender>
      <div className="absolute flex flex-col gap-3 sm:-left-3 -left-1 top-3">
        <LikeCount label={post?.likes} />

        <LikeCount label={post?.dislikes} dislike />
      </div>

      <Link
        href={`/posts/${post?.id}`}
        className="flex flex-col justify-center gap-5"
      >
        <ShouldRender if={!loading}>
          <h2 className="prose dark:prose-invert text-2xl font-bold">
            {post?.title}
          </h2>
        </ShouldRender>

        <ShouldRender if={loading}>
          <Skeleton heading />
        </ShouldRender>

        <ReactMarkdown
          loading={loading}
          lines={3}
          className={`prose-sm line-clamp-4 overflow-hidden text-ellipsis prose-headings:text-base max-h-56`}
          /* 
           This is to avoid any elements not nested properly inside the DOM.
           eg: <a> inside of <a>
           Read more: https://deepscan.io/docs/rules/react-invalid-dom-nesting
           */
          disallowedElements={["a"]}
          unwrapDisallowed
        >
          {post?.body}
        </ReactMarkdown>
      </Link>

      <div className="w-full flex justify-between items-center mt-2">
        <TagList compact loading={loading} tags={post?.tags} />
        <ShouldRender if={!loading}>
          <p className="min-w-min ml-2 sm:text-sm text-xs mt-2">
            by{" "}
            <Link
              href={`/users/${post?.userId}`}
              className="underline text-emerald-700 dark:text-emerald-500 font-bold"
            >
              {getUserDisplayName(post?.user)}
            </Link>
          </p>
        </ShouldRender>
      </div>
    </article>
  );
};

export default PostCard;
