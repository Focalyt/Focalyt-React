import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Flag,
  Trash2,
  Image as ImageIcon,
  Send,
  X,
  MoreHorizontal,
} from 'lucide-react';
import { Can } from '../Components/cms/Can';
import { ConfirmDialog } from '../Components/cms/ConfirmDialog';
import { useClub } from '../../../../contexts/ClubContext';
import { usePermission } from '../hooks/usePermission';
import { findStudentMembership, isApprovedMemberStatus } from '../../../../config/club/membership';

const initialsOf = (name = '') => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'MB';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatFeedTime = (value) => {
  if (!value) return '';
  const raw = String(value).trim();
  const date = raw.length <= 10 ? new Date(`${raw}T12:00:00`) : new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.round((startToday - startThat) / 86400000);
  if (dayDiff === 0) return 'Today';
  if (dayDiff === 1) return 'Yesterday';
  if (dayDiff < 7) return `${dayDiff}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const headlineFromBody = (text) => {
  const first = String(text || '').trim().split(/\n/)[0] || 'Club update';
  return first.slice(0, 80);
};

export const CommunityPage = ({ lockedClubId = '', embedded = false } = {}) => {
  const {
    state,
    activeRole,
    notify,
    createPost,
    togglePostLike,
    addComment,
    reportPost,
    deletePost,
    deleteComment,
    sharePost,
    resolvePostReport,
  } = useClub();
  const { can } = usePermission();

  const isStudent = activeRole === 'student';
  const meId = state.currentStudent.id;
  const meName = state.currentStudent.name || 'Club member';
  const postableClubs = useMemo(() => {
    const allowed = isStudent
      ? state.clubs.filter((club) =>
          isApprovedMemberStatus(findStudentMembership(club, state.currentStudent)?.status)
        )
      : state.clubs.filter((club) => club.canManage !== false);
    return lockedClubId ? allowed.filter((club) => club.id === lockedClubId) : allowed;
  }, [isStudent, lockedClubId, state.clubs, state.currentStudent]);
  const filterClubs = isStudent ? postableClubs : state.clubs;
  const canCompose = isStudent ? postableClubs.length > 0 : can('posts.create');

  const [body, setBody] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [clubId, setClubId] = useState(lockedClubId || postableClubs[0]?.id || '');
  const [pickedFilterClubId, setFilterClubId] = useState('');
  const filterClubId = lockedClubId || pickedFilterClubId;
  const [commentDraft, setCommentDraft] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [menuPostId, setMenuPostId] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const menuRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (lockedClubId) {
      if (clubId !== lockedClubId) setClubId(lockedClubId);
      return;
    }
    if (!postableClubs.some((club) => club.id === clubId)) {
      setClubId(postableClubs[0]?.id || '');
    }
  }, [clubId, lockedClubId, postableClubs]);

  useEffect(() => {
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuPostId('');
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const clubName = (id) => state.clubs.find((club) => club.id === id)?.name || 'Club';

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      notify('Photo too large', 'Use an image under 2 MB.', 'info');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setMediaUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const canSubmitPost = Boolean(clubId) && (Boolean(body.trim()) || Boolean(mediaUrl));

  const handlePost = (event) => {
    event.preventDefault();
    if (!body.trim() && !mediaUrl) return;
    if (!clubId) {
      notify('Choose a club', 'Pick the club this update belongs to.', 'info');
      return;
    }
    const text = body.trim();
    createPost({
      clubId,
      author: meName,
      title: text ? headlineFromBody(text) : 'Shared a photo',
      body: text,
      mediaType: mediaUrl ? 'photo' : 'text',
      mediaUrl: mediaUrl.trim(),
    });
    setBody('');
    setMediaUrl('');
  };

  const filteredPosts = useMemo(() => {
    const scoped = isStudent
      ? state.posts.filter((post) => postableClubs.some((club) => club.id === post.clubId))
      : state.posts;
    const list = filterClubId ? scoped.filter((post) => post.clubId === filterClubId) : scoped;
    return [...list].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
  }, [filterClubId, isStudent, postableClubs, state.posts]);

  const copyShare = (post) => {
    const text = `${post.body || post.title} — ${clubName(post.clubId)}`;
    if (navigator.clipboard) navigator.clipboard.writeText(text);
    sharePost(post.id);
  };

  const isMine = (authorId, author) =>
    (authorId && String(authorId) === String(meId)) || author === meName;

  return (
    <div className={embedded ? 'club-feed club-feed--embedded' : 'club-dash club-feed'}>
      {!embedded ? (
        <header className="club-dash-hero">
          <div>
            <p className="club-dash-hero__eyebrow">Campus board</p>
            <h1>Community</h1>
            <p className="club-dash-hero__sub">Updates from clubs on this campus. Like, comment, or post your own.</p>
          </div>
        </header>
      ) : null}

      {canCompose ? (
        <form className="club-feed-composer" onSubmit={handlePost}>
          <span className="club-dash-avatar" aria-hidden="true">
            {initialsOf(meName)}
          </span>
          <div className="club-feed-composer__body">
            <textarea
              className="club-feed-composer__input"
              rows={3}
              placeholder={
                postableClubs.length
                  ? `Share an update with ${clubName(clubId) || 'your club'}…`
                  : 'Join a club to post here'
              }
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={postableClubs.length === 0}
            />
            {mediaUrl ? (
              <div className="club-feed-photo">
                <img src={mediaUrl} alt="Selected" />
                <button type="button" className="club-feed-photo__remove" onClick={() => setMediaUrl('')} aria-label="Remove photo">
                  <X size={14} />
                </button>
              </div>
            ) : null}
            <div className="club-feed-composer__bar">
              {!lockedClubId ? (
                <select
                  className="club-list-page__select"
                  value={clubId}
                  onChange={(event) => setClubId(event.target.value)}
                  aria-label="Post to club"
                  disabled={postableClubs.length === 0}
                >
                  {postableClubs.length === 0 ? <option value="">Join a club first</option> : null}
                  {postableClubs.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              ) : null}
              <button
                type="button"
                className="fc-btn fc-btn-ghost fc-btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={postableClubs.length === 0}
              >
                <ImageIcon size={15} strokeWidth={2.1} />
                Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoSelect} />
              <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" disabled={!canSubmitPost}>
                Post
              </button>
            </div>
          </div>
        </form>
      ) : null}

      {!lockedClubId && filterClubs.length > 0 ? (
        <div className="club-dash-tabs" role="tablist" aria-label="Filter by club">
          <button
            type="button"
            className={`club-dash-tab ${!filterClubId ? 'is-on' : ''}`}
            onClick={() => setFilterClubId('')}
          >
            All
            <span>{isStudent ? state.posts.filter((post) => postableClubs.some((club) => club.id === post.clubId)).length : state.posts.length}</span>
          </button>
          {filterClubs.map((club) => (
            <button
              key={club.id}
              type="button"
              className={`club-dash-tab ${filterClubId === club.id ? 'is-on' : ''}`}
              onClick={() => setFilterClubId(club.id)}
            >
              {club.name}
              <span>{state.posts.filter((post) => post.clubId === club.id).length}</span>
            </button>
          ))}
        </div>
      ) : null}

      {filteredPosts.length === 0 ? (
        <section className={`club-dash-panel ${embedded ? 'club-feed-welcome' : ''}`}>
          {embedded ? (
            <div className="club-feed-welcome__body">
              <h3>Start the conversation</h3>
              <p>Share updates, wins, or announcements. Members will see them here.</p>
            </div>
          ) : (
            <p className="club-dash-empty">
              {filterClubId ? `No posts in ${clubName(filterClubId)} yet.` : 'No posts yet. Share the first update.'}
            </p>
          )}
        </section>
      ) : (
        <div className="club-feed-list">
          {filteredPosts.map((post) => {
            const comments = state.comments.filter((comment) => comment.postId === post.id);
            const liked = (post.likes || []).includes(meId);
            const showTitle =
              post.title &&
              Boolean(String(post.body || '').trim()) &&
              !String(post.body || '').startsWith(post.title);
            const commentsOpen = Boolean(openComments[post.id]);
            const canRemovePost = isMine(post.authorId, post.author) || can('posts.moderate');
            const showMenu = can('posts.interact') || canRemovePost;

            return (
              <article key={post.id} className="club-feed-card">
                <header className="club-feed-card__head">
                  <span className="club-dash-avatar" aria-hidden="true">
                    {initialsOf(post.author)}
                  </span>
                  <div className="club-feed-card__who">
                    <strong>{post.author}</strong>
                    <span>
                      {clubName(post.clubId)}
                      {post.createdAt ? ` · ${formatFeedTime(post.createdAt)}` : ''}
                    </span>
                  </div>
                  {can('posts.moderate') && (post.reports || []).length > 0 && post.reportStatus !== 'resolved' ? (
                    <em className="club-feed-flag">Reported</em>
                  ) : null}
                  {showMenu ? (
                  <div className="club-feed-more" ref={menuPostId === post.id ? menuRef : null}>
                    <button
                      type="button"
                      className="club-feed-more__btn"
                      aria-label="Post actions"
                      onClick={() => setMenuPostId((id) => (id === post.id ? '' : post.id))}
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    {menuPostId === post.id ? (
                      <div className="club-feed-more__menu" role="menu">
                        {can('posts.interact') ? (
                          <button type="button" onClick={() => { setMenuPostId(''); reportPost(post.id); }}>
                            <Flag size={13} /> Report
                          </button>
                        ) : null}
                        {can('posts.moderate') && (post.reports || []).length > 0 && post.reportStatus !== 'resolved' ? (
                          <button type="button" onClick={() => { setMenuPostId(''); resolvePostReport(post.id); }}>
                            Resolve report
                          </button>
                        ) : null}
                        {canRemovePost ? (
                          <button
                            type="button"
                            className="is-danger"
                            onClick={() => {
                              setMenuPostId('');
                              setConfirmAction({
                                type: 'post',
                                id: post.id,
                                title: 'Delete this post?',
                                body: 'It will be removed from the club feed.',
                                confirmLabel: 'Delete post',
                              });
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  ) : null}
                </header>

                {showTitle || post.body ? (
                  <div className="club-feed-card__content">
                    {showTitle ? <h3>{post.title}</h3> : null}
                    {post.body ? <p>{post.body}</p> : null}
                  </div>
                ) : null}
                {post.mediaUrl ? (
                  <button
                    type="button"
                    className="club-feed-card__media"
                    onClick={() => setPreviewImage(post.mediaUrl)}
                    aria-label="View photo full size"
                  >
                    <img src={post.mediaUrl} alt="" loading="lazy" />
                  </button>
                ) : null}

                <div className="club-feed-card__actions">
                  <Can permission="posts.interact">
                    <button
                      type="button"
                      className={`club-feed-action ${liked ? 'is-on' : ''}`}
                      onClick={() => togglePostLike(post.id)}
                    >
                      <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
                      {post.likes?.length || 0}
                    </button>
                    <button
                      type="button"
                      className={`club-feed-action ${commentsOpen ? 'is-on' : ''}`}
                      onClick={() => setOpenComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                    >
                      <MessageCircle size={16} />
                      {comments.length}
                    </button>
                    <button type="button" className="club-feed-action" onClick={() => copyShare(post)}>
                      <Share2 size={16} />
                    </button>
                  </Can>
                </div>

                {commentsOpen ? (
                  <div className="club-feed-comments">
                    {comments.map((comment) => (
                      <div key={comment.id} className="club-feed-comment">
                        <span className="club-dash-avatar club-dash-avatar--sm" aria-hidden="true">
                          {initialsOf(comment.author)}
                        </span>
                        <div>
                          <strong>{comment.author}</strong>
                          <p>{comment.body}</p>
                        </div>
                        {isMine(comment.authorId, comment.author) || can('posts.moderate') ? (
                          <button
                            type="button"
                            className="club-feed-comment__del"
                            aria-label="Delete comment"
                            onClick={() =>
                              setConfirmAction({
                                type: 'comment',
                                postId: post.id,
                                id: comment.id,
                                title: 'Delete this comment?',
                                body: 'It will be removed from the thread.',
                                confirmLabel: 'Delete comment',
                              })
                            }
                          >
                            <Trash2 size={12} />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    <Can permission="posts.interact">
                      <form
                        className="club-feed-reply"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const text = commentDraft[post.id];
                          if (!text?.trim()) return;
                          addComment(post.id, text.trim());
                          setCommentDraft((draft) => ({ ...draft, [post.id]: '' }));
                        }}
                      >
                        <input
                          className="form-input"
                          placeholder="Write a comment…"
                          value={commentDraft[post.id] || ''}
                          onChange={(event) =>
                            setCommentDraft((draft) => ({ ...draft, [post.id]: event.target.value }))
                          }
                        />
                        <button type="submit" className="fc-btn fc-btn-primary fc-btn-sm" disabled={!commentDraft[post.id]?.trim()}>
                          <Send size={13} />
                        </button>
                      </form>
                    </Can>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      {previewImage ? (
        <div
          className="club-feed-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
          onClick={() => setPreviewImage('')}
        >
          <button
            type="button"
            className="club-feed-lightbox__close"
            onClick={() => setPreviewImage('')}
            aria-label="Close photo"
          >
            <X size={18} />
          </button>
          <img src={previewImage} alt="" onClick={(event) => event.stopPropagation()} />
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmAction)}
        title={confirmAction?.title}
        body={confirmAction?.body}
        confirmLabel={confirmAction?.confirmLabel}
        onConfirm={() => {
          if (confirmAction?.type === 'post') deletePost(confirmAction.id);
          if (confirmAction?.type === 'comment') deleteComment(confirmAction.postId, confirmAction.id);
          setConfirmAction(null);
        }}
        onClose={() => setConfirmAction(null)}
      />
    </div>
  );
};

export default CommunityPage;
