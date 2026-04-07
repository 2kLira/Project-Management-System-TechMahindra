function Dashboard({ onLogin }){
    async function log_out(){
        await fetch('http://localhost:8080/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        onLogin();
    }
    return (
        <div>
            <button onClick={log_out}>Log out</button>
            <h1>Login success</h1>
        </div>
    );
}
export default Dashboard;