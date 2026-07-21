const React = require('react');

function TestReact(props) {
    return (
        <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', color: '#333' }}>
            <h1 style={{ color: '#6d28d9' }}>React JSX is fully functional!</h1>
            <p>This screen is a default, proper React component rendered to HTML on the server.</p>
        </div>
    );
}

module.exports = TestReact;
