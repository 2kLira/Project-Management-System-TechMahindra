function Dashboard({ onLogin }){
    function log_out(){
        localStorage.removeItem('token')
        localStorage.removeItem('username')

        onLogin();
    }
    return (
        <div>
            <button onClick={log_out}>Login out</button>
            <h1>Login success</h1>
        </div>
    );
}
export default Dashboard;