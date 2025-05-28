import styles from './page.module.scss';

const Credits = () => {
  return (
    <div className={styles.Page}>
      <h1>Credits</h1>
      <p>
        This project was built on the shoulders of giants, using the following technologies and
        libraries:
      </p>
      <ul>
        <li>
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
            Next.js
          </a>{' '}
          - The React Framework for the Web.
        </li>
        <li>
          <a href="https://prisma.io/orm" target="_blank" rel="noopener noreferrer">
            Prisma
          </a>{' '}
          - Next-generation Node.js and TypeScript ORM.
        </li>
        <li>
          <a href="https://react.dev" target="_blank" rel="noopener noreferrer">
            React
          </a>{' '}
          - The library for web and native user interfaces.
        </li>
        <li>
          <a href="https://base-ui.com" target="_blank" rel="noopener noreferrer">
            Base UI
          </a>{' '}
          - Unstyled UI components for building accessible web apps and design systems.
        </li>
        <li>
          <a href="https://lucide.dev/icons/" target="_blank" rel="noopener noreferrer">
            Lucide
          </a>{' '}
          - A collection of open-source icons for React and other frameworks.
        </li>
        <li>
          <a href="https://date-fns.org" target="_blank" rel="noopener noreferrer">
            date-fns
          </a>{' '}
          - Modern JavaScript date utility library.
        </li>
      </ul>
    </div>
  );
};

export default Credits;
