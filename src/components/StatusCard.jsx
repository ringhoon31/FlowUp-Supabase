function StatusCard({ icon, title, value, description, color }) {
  return (
    <div className={`status-card ${color}`}>

      <div className="card-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>

        <h2>{value}</h2>

        <small>{description}</small>
      </div>

    </div>
  )
}

export default StatusCard