import {createRoot} from 'react-dom/client';
import Site from './Site.tsx';
import './styles.css';
const root=document.getElementById('root');if(!root)throw Error('Missing root element.');createRoot(root).render(<Site/>);
