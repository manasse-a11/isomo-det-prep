import TetrisGame from './TetrisGame';

export default function WordArcade({userId,onBack,onStudySkill}:{userId:string;name:string;progress:Record<string,any>;onBack:()=>void;onStudySkill:(skill:string)=>void}) {
  return <TetrisGame userId={userId} onBack={onBack} onStudySkill={onStudySkill} />;
}
