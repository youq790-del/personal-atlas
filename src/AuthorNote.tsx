import { useId } from 'react';
import { Icon } from './Icon';
import './author-note.css';

type Props = { name: string; bio: string; onContact: () => void };
const fallbackBio = '写物理、C++ 和材料力学的学习笔记，也做 Blender 练习。课外打羽毛球、看剧，偶尔一起写进公众号。';

export function AuthorNote({ name, bio, onContact }: Props) {
  const headingId = useId();
  const displayName = name.trim() || 'yo7';
  const repeatedIdentity = `我叫 ${displayName}，读理工科。`;
  const suppliedBio = bio.trim().startsWith(repeatedIdentity) ? bio.trim().slice(repeatedIdentity.length).trim() : bio.trim();
  const sentences = (suppliedBio || fallbackBio).match(/[^。！？!?]+[。！？!?]?/g)?.slice(0, 2) || [fallbackBio];

  return <section id="experience" className="author-note" aria-labelledby={headingId}>
    <div className="author-note-layout">
      <div className="author-note-signature">
        <h2 id={headingId}>{displayName}<span aria-hidden="true">.</span></h2>
        <p>理工科在读。</p>
      </div>
      <div className="author-note-copy">
        <div className="author-note-bio">{sentences.map((sentence, index) => <p key={index}>{sentence.trim()}</p>)}</div>
        <button type="button" onClick={onContact} className="author-note-contact"><span>打个招呼</span><Icon name="arrow-right-up-linear" size={21}/></button>
      </div>
    </div>
  </section>;
}
