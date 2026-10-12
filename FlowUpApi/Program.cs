using Oracle.ManagedDataAccess.Client;

var builder = WebApplication.CreateBuilder(args);

var connectionString =
    builder.Configuration.GetConnectionString("OracleDb");

// Oracle Wallet 경로 설정 (로컬 / 배포 환경 공용)
var walletPath = builder.Configuration["ORACLE_WALLET_PATH"]
    ?? @"C:\Users\ringh\Downloads\Wallet_FLOWUPDB";

OracleConfiguration.TnsAdmin = walletPath;
OracleConfiguration.WalletLocation = walletPath;

// ======================================================
// CORS
// ======================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactPolicy", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("ReactPolicy");

// ======================================================
// Current Data
// ======================================================

int inCount = 0;
int outCount = 0;
int peopleNow = 0;
string lastEvent = "NONE";
string createdAt = "NONE";

// ======================================================
// Simple Web Page
// ======================================================

app.MapGet("/", () =>
{
    string html =
        "<!DOCTYPE html>" +
        "<html>" +

        "<head>" +
        "<meta charset='UTF-8'>" +
        "<meta http-equiv='refresh' content='2'>" +
        "<title>Smart Store</title>" +

        "<style>" +

        "body {" +
        "font-family: Arial;" +
        "text-align: center;" +
        "background: #f5f5f5;" +
        "padding-top: 50px;" +
        "}" +

        "h1 { font-size: 40px; }" +

        ".container {" +
        "display: flex;" +
        "justify-content: center;" +
        "gap: 30px;" +
        "margin-top: 40px;" +
        "}" +

        ".box {" +
        "background: white;" +
        "padding: 30px;" +
        "width: 180px;" +
        "border-radius: 15px;" +
        "box-shadow: 0 3px 10px rgba(0,0,0,0.15);" +
        "}" +

        ".number {" +
        "font-size: 50px;" +
        "font-weight: bold;" +
        "}" +

        ".label {" +
        "font-size: 22px;" +
        "}" +

        ".datetime {" +
        "margin-top: 30px;" +
        "font-size: 22px;" +
        "}" +

        ".hourly {" +
        "margin: 50px auto;" +
        "width: 80%;" +
        "max-width: 800px;" +
        "background: white;" +
        "padding: 25px;" +
        "border-radius: 15px;" +
        "box-shadow: 0 3px 10px rgba(0,0,0,0.15);" +
        "}" +

        "table {" +
        "width: 100%;" +
        "border-collapse: collapse;" +
        "margin-top: 20px;" +
        "}" +

        "th, td {" +
        "padding: 14px;" +
        "border-bottom: 1px solid #ddd;" +
        "font-size: 18px;" +
        "}" +

        "th {" +
        "background: #f0f0f0;" +
        "}" +

        "</style>" +

        "</head>" +

        "<body>" +

        "<h1>Smart Store</h1>" +

        "<div class='container'>" +

        "<div class='box'>" +
        "<div class='label'>IN</div>" +
        "<div class='number'>" + inCount + "</div>" +
        "</div>" +

        "<div class='box'>" +
        "<div class='label'>OUT</div>" +
        "<div class='number'>" + outCount + "</div>" +
        "</div>" +

        "<div class='box'>" +
        "<div class='label'>PEOPLE NOW</div>" +
        "<div class='number'>" + peopleNow + "</div>" +
        "</div>" +

        "</div>" +

        "<h2>Last Event: " + lastEvent + "</h2>" +

        "<div class='datetime'>" +
        "Date / Time: " + createdAt +
        "</div>" +

        "<div class='hourly'>" +

        "<h2>Hourly Statistics</h2>" +

        "<table>" +

        "<thead>" +
        "<tr>" +
        "<th>Time</th>" +
        "<th>IN</th>" +
        "<th>OUT</th>" +
        "</tr>" +
        "</thead>" +

        "<tbody id='hourlyTable'>" +
        "<tr>" +
        "<td colspan='3'>Loading...</td>" +
        "</tr>" +
        "</tbody>" +

        "</table>" +

        "</div>" +

        "<script>" +

        "fetch('/api/people/hourly')" +
        ".then(response => response.json())" +
        ".then(data => {" +

        "let table = document.getElementById('hourlyTable');" +

        "table.innerHTML = '';" +

        "data.forEach(item => {" +

        "let row = document.createElement('tr');" +

        "let time = new Date(item.hour);" +

        "let hourText = time.getHours().toString().padStart(2, '0') + ':00';" +

        "row.innerHTML =" +
        "'<td>' + hourText + '</td>' +" +
        "'<td>' + item.inCount + ' people</td>' +" +
        "'<td>' + item.outCount + ' people</td>';" +

        "table.appendChild(row);" +

        "});" +

        "})" +

        ".catch(error => {" +
        "console.log(error);" +
        "});" +

        "</script>" +

        "</body>" +

        "</html>";

    return Results.Content(html, "text/html");
});

// ======================================================
// GET /api/people
// Current latest data
// ======================================================

app.MapGet("/api/people", async () =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        const string sql = @"
            SELECT
                in_count,
                out_count,
                current_people,
                event_type,
                log_time
            FROM flowup_visitor_logs
            ORDER BY log_time DESC
            FETCH FIRST 1 ROW ONLY";

        await using var command =
            new OracleCommand(sql, connection);

        await using var reader =
            await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            return Results.Ok(new
            {
                inCount = reader["IN_COUNT"],
                outCount = reader["OUT_COUNT"],
                peopleNow = reader["CURRENT_PEOPLE"],
                lastEvent = reader["EVENT_TYPE"],
                createdAt = reader["LOG_TIME"]
            });
        }

        return Results.Ok(new
        {
            inCount = 0,
            outCount = 0,
            peopleNow = 0,
            lastEvent = "NONE",
            createdAt = (object?)null
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("Oracle DB ERROR:");
       Console.WriteLine(ex.ToString());

        return Results.Problem(
            "Failed to read current data from Oracle DB."
        );
    }
});

// ======================================================
// GET /api/people/history
// Full event history
// ======================================================

app.MapGet("/api/people/history", async () =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        const string sql = @"
            SELECT
                device_id,
                event_type,
                in_count,
                out_count,
                current_people,
                log_time
            FROM flowup_visitor_logs
            ORDER BY log_time DESC";

        await using var command =
            new OracleCommand(sql, connection);

        await using var reader =
            await command.ExecuteReaderAsync();

        var history = new List<object>();

        while (await reader.ReadAsync())
        {
            history.Add(new
            {
                deviceId = reader["DEVICE_ID"],
                eventType = reader["EVENT_TYPE"],
                inCount = reader["IN_COUNT"],
                outCount = reader["OUT_COUNT"],
                peopleNow = reader["CURRENT_PEOPLE"],
                createdAt = reader["LOG_TIME"]
            });
        }

        return Results.Ok(history);
    }
    catch (Exception ex)
    {
        Console.WriteLine("Oracle DB ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Failed to read history from Oracle DB."
        );
    }
});

// ======================================================
// GET /api/people/hourly
// Hourly IN / OUT statistics
// ======================================================

app.MapGet("/api/people/hourly", async () =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        const string sql = @"
            WITH ordered_logs AS
            (
                SELECT
                    log_id,
                    device_id,
                    log_time,
                    in_count,
                    out_count,
                    LAG(in_count) OVER
                    (
                        PARTITION BY device_id
                        ORDER BY log_time, log_id
                    ) AS previous_in_count,
                    LAG(out_count) OVER
                    (
                        PARTITION BY device_id
                        ORDER BY log_time, log_id
                    ) AS previous_out_count
                FROM flowup_visitor_logs
            )
            SELECT
                TRUNC(CAST(log_time AS DATE), 'HH') AS hour_start,

                SUM(
                    GREATEST(
                        in_count - NVL(previous_in_count, 0),
                        0
                    )
                ) AS in_count,

                SUM(
                    GREATEST(
                        out_count - NVL(previous_out_count, 0),
                        0
                    )
                ) AS out_count

            FROM ordered_logs

            GROUP BY
                TRUNC(CAST(log_time AS DATE), 'HH')

            ORDER BY
                hour_start";

        await using var command =
            new OracleCommand(sql, connection);

        await using var reader =
            await command.ExecuteReaderAsync();

        var hourlyData = new List<object>();

        while (await reader.ReadAsync())
        {
            hourlyData.Add(new
            {
                hour = reader["HOUR_START"],
                inCount = reader["IN_COUNT"],
                outCount = reader["OUT_COUNT"]
            });
        }

        return Results.Ok(hourlyData);
    }
    catch (Exception ex)
    {
        Console.WriteLine("Oracle DB ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Failed to read hourly data from Oracle DB."
        );
    }
});

// ======================================================
// STORES API
// React 관리자 화면에서 사용하는 매장 조회/등록/수정/삭제
// ======================================================

app.MapGet("/api/stores", async () =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        const string sql = @"
            SELECT
                store_id,
                store_name,
                address,
                latitude,
                longitude,
                device_id,
                user_id
            FROM stores
            ORDER BY store_id";

        await using var command =
            new OracleCommand(sql, connection);

        await using var reader =
            await command.ExecuteReaderAsync();

        var stores = new List<object>();

        while (await reader.ReadAsync())
        {
            stores.Add(new
            {
                id = Convert.ToInt32(reader["STORE_ID"]),
                name = reader["STORE_NAME"]?.ToString() ?? "",
                address = reader["ADDRESS"]?.ToString() ?? "",
                latitude = reader["LATITUDE"] == DBNull.Value
                    ? (double?)null
                    : Convert.ToDouble(reader["LATITUDE"]),
                longitude = reader["LONGITUDE"] == DBNull.Value
                    ? (double?)null
                    : Convert.ToDouble(reader["LONGITUDE"]),
                deviceId = reader["DEVICE_ID"] == DBNull.Value
                    ? ""
                    : reader["DEVICE_ID"]?.ToString() ?? "",
                userId = reader["USER_ID"] == DBNull.Value
                    ? (int?)null
                    : Convert.ToInt32(reader["USER_ID"])
            });
        }

        return Results.Ok(stores);
    }
    catch (Exception ex)
    {
        Console.WriteLine("STORE SELECT ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Failed to read stores from Oracle DB."
        );
    }
});

app.MapPost("/api/stores", async (StoreRequest data) =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        await using var transaction =
            connection.BeginTransaction();

        // 현재 DB에 STORES 전용 sequence가 있다는 전제 대신
        // MAX + 1 방식으로 기존 테이블 구조를 그대로 사용한다.
        const string insertSql = @"
            INSERT INTO stores
            (
                store_id,
                store_name,
                address,
                latitude,
                longitude,
                device_id,
                user_id
            )
            VALUES
            (
                (
                    SELECT NVL(MAX(store_id), 0) + 1
                    FROM stores
                ),
                :store_name,
                :address,
                :latitude,
                :longitude,
                :device_id,
                :user_id
            )";

        await using var command =
            new OracleCommand(insertSql, connection);

        command.Transaction = transaction;
        command.BindByName = true;

        command.Parameters.Add(
            "store_name",
            OracleDbType.Varchar2
        ).Value = data.StoreName.Trim();

        command.Parameters.Add(
            "address",
            OracleDbType.Varchar2
        ).Value = data.Address.Trim();

        command.Parameters.Add(
            "latitude",
            OracleDbType.Decimal
        ).Value = data.Latitude;

        command.Parameters.Add(
            "longitude",
            OracleDbType.Decimal
        ).Value = data.Longitude;

        command.Parameters.Add(
            "device_id",
            OracleDbType.Varchar2
        ).Value = string.IsNullOrWhiteSpace(data.DeviceId)
            ? DBNull.Value
            : data.DeviceId.Trim();

        command.Parameters.Add(
            "user_id",
            OracleDbType.Int32
        ).Value = data.UserId.HasValue
            ? data.UserId.Value
            : DBNull.Value;

        await command.ExecuteNonQueryAsync();

        await using var idCommand =
            new OracleCommand(
                "SELECT MAX(store_id) FROM stores",
                connection
            );

        idCommand.Transaction = transaction;

        var idResult =
            await idCommand.ExecuteScalarAsync();

        var storeId =
            Convert.ToInt32(idResult);

        transaction.Commit();

        return Results.Ok(new
        {
            store = new
            {
                id = storeId,
                name = data.StoreName.Trim(),
                address = data.Address.Trim(),
                latitude = data.Latitude,
                longitude = data.Longitude,
                deviceId = data.DeviceId?.Trim() ?? "",
                userId = data.UserId
            }
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("STORE INSERT ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Failed to save store to Oracle DB."
        );
    }
});

app.MapPut("/api/stores/{storeId:int}", async (
    int storeId,
    StoreRequest data) =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        const string sql = @"
            UPDATE stores
            SET
                store_name = :store_name,
                address = :address,
                latitude = :latitude,
                longitude = :longitude,
                device_id = :device_id,
                user_id = :user_id
            WHERE store_id = :store_id";

        await using var command =
            new OracleCommand(sql, connection);

        command.BindByName = true;

        command.Parameters.Add(
            "store_name",
            OracleDbType.Varchar2
        ).Value = data.StoreName.Trim();

        command.Parameters.Add(
            "address",
            OracleDbType.Varchar2
        ).Value = data.Address.Trim();

        command.Parameters.Add(
            "latitude",
            OracleDbType.Decimal
        ).Value = data.Latitude;

        command.Parameters.Add(
            "longitude",
            OracleDbType.Decimal
        ).Value = data.Longitude;

        command.Parameters.Add(
            "device_id",
            OracleDbType.Varchar2
        ).Value = string.IsNullOrWhiteSpace(data.DeviceId)
            ? DBNull.Value
            : data.DeviceId.Trim();

        command.Parameters.Add(
            "user_id",
            OracleDbType.Int32
        ).Value = data.UserId.HasValue
            ? data.UserId.Value
            : DBNull.Value;

        command.Parameters.Add(
            "store_id",
            OracleDbType.Int32
        ).Value = storeId;

        var affected =
            await command.ExecuteNonQueryAsync();

        if (affected == 0)
        {
            return Results.NotFound(new
            {
                message = "해당 매장을 찾을 수 없습니다."
            });
        }

        return Results.Ok(new
        {
            store = new
            {
                id = storeId,
                name = data.StoreName.Trim(),
                address = data.Address.Trim(),
                latitude = data.Latitude,
                longitude = data.Longitude,
                deviceId = data.DeviceId?.Trim() ?? "",
                userId = data.UserId
            }
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("STORE UPDATE ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Failed to update store in Oracle DB."
        );
    }
});

app.MapDelete("/api/stores/{storeId:int}", async (int storeId) =>
{
    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        // 방문 기록이 연결되어 있으므로 먼저 방문 기록을 삭제한다.
        await using var transaction =
            connection.BeginTransaction();

        const string deleteLogsSql = @"
            DELETE FROM flowup_visitor_logs
            WHERE store_id = :store_id";

        await using (var logCommand =
            new OracleCommand(deleteLogsSql, connection))
        {
            logCommand.Transaction = transaction;
            logCommand.BindByName = true;
            logCommand.Parameters.Add(
                "store_id",
                OracleDbType.Int32
            ).Value = storeId;

            await logCommand.ExecuteNonQueryAsync();
        }

        const string deleteStoreSql = @"
            DELETE FROM stores
            WHERE store_id = :store_id";

        await using (var storeCommand =
            new OracleCommand(deleteStoreSql, connection))
        {
            storeCommand.Transaction = transaction;
            storeCommand.BindByName = true;
            storeCommand.Parameters.Add(
                "store_id",
                OracleDbType.Int32
            ).Value = storeId;

            var affected =
                await storeCommand.ExecuteNonQueryAsync();

            if (affected == 0)
            {
                transaction.Rollback();

                return Results.NotFound(new
                {
                    message = "해당 매장을 찾을 수 없습니다."
                });
            }
        }

        transaction.Commit();

        return Results.Ok(new
        {
            message = "매장이 삭제되었습니다.",
            storeId
        });
    }
    catch (Exception ex)
    {
        Console.WriteLine("STORE DELETE ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Failed to delete store from Oracle DB."
        );
    }
});

// ======================================================
// POST /api/people
// ESP32 sends data
//
// Arduino → API → STORES(device_id) → FLOWUP_VISITOR_LOGS
// PEOPLE_EVENTS는 사용하지 않음
// ======================================================

app.MapPost("/api/people", async (PeopleData data) =>
{
    inCount = data.InCount;
    outCount = data.OutCount;
    peopleNow = data.PeopleNow;
    lastEvent = data.Event;

    Console.WriteLine();
    Console.WriteLine("----- DATA RECEIVED -----");
    Console.WriteLine($"Device ID  : {data.DeviceId}");
    Console.WriteLine($"Event      : {data.Event}");
    Console.WriteLine($"IN Count   : {data.InCount}");
    Console.WriteLine($"OUT Count  : {data.OutCount}");
    Console.WriteLine($"People Now : {data.PeopleNow}");

    try
    {
        await using var connection =
            new OracleConnection(connectionString);

        await connection.OpenAsync();

        using var transaction = connection.BeginTransaction();

        // ==================================================
        // 1. Arduino의 deviceId로 등록된 매장 찾기
        // ==================================================

        const string storeSql = @"
            SELECT store_id
            FROM stores
            WHERE device_id = :device_id
            FETCH FIRST 1 ROW ONLY";

        int? storeId = null;

        await using (var storeCommand =
            new OracleCommand(storeSql, connection))
        {
            storeCommand.Transaction = transaction;

            storeCommand.Parameters.Add(
                "device_id",
                OracleDbType.Varchar2
            ).Value = data.DeviceId;

            var result = await storeCommand.ExecuteScalarAsync();

            if (result != null && result != DBNull.Value)
            {
                storeId = Convert.ToInt32(result);
            }
        }

        if (storeId == null)
        {
            transaction.Rollback();

            Console.WriteLine(
                $"STORE NOT FOUND: device_id = {data.DeviceId}"
            );

            return Results.BadRequest(new
            {
                message =
                    "해당 Device ID가 STORES에 등록되어 있지 않습니다.",
                deviceId = data.DeviceId
            });
        }

        Console.WriteLine($"Store ID   : {storeId.Value}");

        // ==================================================
        // 2. FlowUp 방문 기록 저장
        // ==================================================

        const string insertSql = @"
            INSERT INTO flowup_visitor_logs
            (
                store_id,
                device_id,
                event_type,
                in_count,
                out_count,
                current_people
            )
            VALUES
            (
                :store_id,
                :device_id,
                :event_type,
                :in_count,
                :out_count,
                :current_people
            )";

        await using var command =
            new OracleCommand(insertSql, connection);

        command.Transaction = transaction;

        command.Parameters.Add(
            "store_id",
            OracleDbType.Int32
        ).Value = storeId.Value;

        command.Parameters.Add(
            "device_id",
            OracleDbType.Varchar2
        ).Value = data.DeviceId;

        command.Parameters.Add(
            "event_type",
            OracleDbType.Varchar2
        ).Value = data.Event;

        command.Parameters.Add(
            "in_count",
            OracleDbType.Int32
        ).Value = data.InCount;

        command.Parameters.Add(
            "out_count",
            OracleDbType.Int32
        ).Value = data.OutCount;

        command.Parameters.Add(
            "current_people",
            OracleDbType.Int32
        ).Value = data.PeopleNow;

        await command.ExecuteNonQueryAsync();

        transaction.Commit();

        createdAt =
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss");

        Console.WriteLine(
            "Oracle DB: FLOWUP_VISITOR_LOGS INSERT SUCCESS"
        );
        Console.WriteLine($"Store ID   : {storeId.Value}");
        Console.WriteLine($"Created At : {createdAt}");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Oracle DB ERROR:");
        Console.WriteLine(ex.Message);

        return Results.Problem(
            "Database insert failed."
        );
    }

    return Results.Ok(new
    {
        message =
            "Data received and saved to FlowUp Oracle DB successfully",
        deviceId = data.DeviceId,
        inCount = inCount,
        outCount = outCount,
        peopleNow = peopleNow,
        lastEvent = lastEvent,
        createdAt = createdAt
    });
});

// ======================================================
// Start Server
// ======================================================

var port = Environment.GetEnvironmentVariable("PORT") ?? "5013";

app.Run($"http://0.0.0.0:{port}");
// ======================================================
// Request Model
// ======================================================

public record PeopleData(
    string DeviceId,
    string Event,
    int InCount,
    int OutCount,
    int PeopleNow
);

public record StoreRequest(
    string StoreName,
    string Address,
    double Latitude,
    double Longitude,
    string? DeviceId,
    int? UserId
);