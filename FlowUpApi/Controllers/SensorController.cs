using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;

namespace FlowUpApi.Controllers
{
    // 아두이노에서 보내는 방문자 데이터
    public class VisitorDataDto
    {
        public int StoreId { get; set; }
        public int InCount { get; set; }
        public int OutCount { get; set; }
        public int CurrentPeople { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class SensorController : ControllerBase
    {
        // Oracle DB 연결 정보
        private readonly string _oracleConnStr =
            "Data Source=(DESCRIPTION=" +
            "(ADDRESS=(PROTOCOL=TCP)(HOST=localhost)(PORT=1521))" +
            "(CONNECT_DATA=(SERVICE_NAME=xe)));" +
            "User Id=system;" +
            "Password=1234;";

        // ==========================================
        // 1. Arduino → Oracle
        // POST /api/sensor/visitor
        // ==========================================

        [HttpPost("visitor")]
        public IActionResult ReceiveVisitorData(
            [FromBody] VisitorDataDto dto)
        {
            if (dto == null)
            {
                return BadRequest(new
                {
                    status = "Error",
                    message = "데이터가 비어있습니다."
                });
            }

            try
            {
                using (OracleConnection conn =
                    new OracleConnection(_oracleConnStr))
                {
                    conn.Open();

                    string query = @"
                        INSERT INTO VISITOR_LOGS
                        (
                            LOG_ID,
                            STORE_ID,
                            IN_COUNT,
                            OUT_COUNT,
                            CURRENT_PEOPLE,
                            LOG_TIME
                        )
                        VALUES
                        (
                            VISITOR_LOGS_SEQ.NEXTVAL,
                            :storeId,
                            :inCount,
                            :outCount,
                            :currentPeople,
                            SYSTIMESTAMP
                        )";

                    using (OracleCommand cmd =
                        new OracleCommand(query, conn))
                    {
                        // 이름으로 파라미터 연결
                        cmd.BindByName = true;

                        cmd.Parameters.Add(
                            "storeId",
                            OracleDbType.Int32
                        ).Value = dto.StoreId;

                        cmd.Parameters.Add(
                            "inCount",
                            OracleDbType.Int32
                        ).Value = dto.InCount;

                        cmd.Parameters.Add(
                            "outCount",
                            OracleDbType.Int32
                        ).Value = dto.OutCount;

                        cmd.Parameters.Add(
                            "currentPeople",
                            OracleDbType.Int32
                        ).Value = dto.CurrentPeople;

                        cmd.ExecuteNonQuery();
                    }
                }

                return Ok(new
                {
                    status = "Success",
                    message = "Oracle DB 저장 완료"
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Oracle 저장 오류: " + ex.Message
                );

                return StatusCode(500, new
                {
                    status = "Error",
                    message = ex.Message
                });
            }
        }


        // ==========================================
        // 2. Oracle → React
        // GET /api/sensor/current/1
        // ==========================================

        [HttpGet("current/{storeId}")]
        public IActionResult GetCurrentStatus(int storeId)
        {
            try
            {
                using (OracleConnection conn =
                    new OracleConnection(_oracleConnStr))
                {
                    conn.Open();

                    // ----------------------------------
                    // 매장 정보 + 오늘 방문 데이터
                    // ----------------------------------

                    string summaryQuery = @"
                        SELECT
                            S.STORE_NAME,

                            NVL(
                                (
                                    SELECT SUM(IN_COUNT)
                                    FROM VISITOR_LOGS
                                    WHERE STORE_ID = :storeId
                                    AND TRUNC(LOG_TIME) =
                                        TRUNC(SYSDATE)
                                ),
                                0
                            ) AS TODAY_IN,

                            NVL(
                                (
                                    SELECT SUM(OUT_COUNT)
                                    FROM VISITOR_LOGS
                                    WHERE STORE_ID = :storeId
                                    AND TRUNC(LOG_TIME) =
                                        TRUNC(SYSDATE)
                                ),
                                0
                            ) AS TODAY_OUT,

                            NVL(
                                (
                                    SELECT CURRENT_PEOPLE
                                    FROM
                                    (
                                        SELECT CURRENT_PEOPLE
                                        FROM VISITOR_LOGS
                                        WHERE STORE_ID = :storeId
                                        ORDER BY LOG_ID DESC
                                    )
                                    WHERE ROWNUM = 1
                                ),
                                0
                            ) AS CURRENT_PEOPLE

                        FROM STORES S
                        WHERE S.STORE_ID = :storeId";

                    string storeName = "알 수 없음";
                    int todayIn = 0;
                    int todayOut = 0;
                    int currentPeople = 0;

                    using (OracleCommand cmd =
                        new OracleCommand(
                            summaryQuery,
                            conn))
                    {
                        cmd.BindByName = true;

                        cmd.Parameters.Add(
                            "storeId",
                            OracleDbType.Int32
                        ).Value = storeId;

                        using (var reader =
                            cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                storeName =
                                    reader["STORE_NAME"]
                                        .ToString();

                                todayIn =
                                    Convert.ToInt32(
                                        reader["TODAY_IN"]
                                    );

                                todayOut =
                                    Convert.ToInt32(
                                        reader["TODAY_OUT"]
                                    );

                                currentPeople =
                                    Convert.ToInt32(
                                        reader["CURRENT_PEOPLE"]
                                    );
                            }
                        }
                    }


                    // ----------------------------------
                    // 최근 로그 5개
                    // ----------------------------------

                    string logQuery = @"
                        SELECT
                            LOG_ID,
                            IN_COUNT,
                            OUT_COUNT,
                            CURRENT_PEOPLE,
                            TO_CHAR(
                                LOG_TIME,
                                'YYYY-MM-DD HH24:MI:SS'
                            ) AS LOG_TIME

                        FROM
                        (
                            SELECT
                                LOG_ID,
                                IN_COUNT,
                                OUT_COUNT,
                                CURRENT_PEOPLE,
                                LOG_TIME

                            FROM VISITOR_LOGS

                            WHERE STORE_ID = :storeId

                            ORDER BY LOG_ID DESC
                        )

                        WHERE ROWNUM <= 5";

                    var logs = new List<object>();

                    using (OracleCommand cmd =
                        new OracleCommand(
                            logQuery,
                            conn))
                    {
                        cmd.BindByName = true;

                        cmd.Parameters.Add(
                            "storeId",
                            OracleDbType.Int32
                        ).Value = storeId;

                        using (var reader =
                            cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                logs.Add(new
                                {
                                    logId =
                                        reader["LOG_ID"],

                                    inCount =
                                        reader["IN_COUNT"],

                                    outCount =
                                        reader["OUT_COUNT"],

                                    currentPeople =
                                        reader["CURRENT_PEOPLE"],

                                    logTime =
                                        reader["LOG_TIME"]
                                            .ToString()
                                });
                            }
                        }
                    }


                    // ----------------------------------
                    // React에 반환
                    // ----------------------------------

                    return Ok(new
                    {
                        storeId,
                        storeName,
                        todayIn,
                        todayOut,
                        currentPeople,
                        recentLogs = logs
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    "Oracle 조회 오류: " + ex.Message
                );

                return StatusCode(500, new
                {
                    status = "Error",
                    message = "DB 연동 오류: " +
                              ex.Message
                });
            }
        }
    }
}