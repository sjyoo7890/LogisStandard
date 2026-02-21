# Phase 3: 데이터베이스 설계 (packages/database)

> 우정사업본부 자동화설비 표준 인터페이스 및 통합플랫폼 구현 프롬프트

```
packages/database 패키지를 구현해줘. Prisma ORM을 사용한다.

[운영 DB - psm_operation 스키마]

1) 모델 정의 테이블:
- tb_model_machine_mt: 구분기 Model 정의 Master
  (machine_id VARCHAR(6) PK, machine_type VARCHAR(1) 소포:P/C:Conveyor/S:Sorter, 
   machine_name VARCHAR(14), machine_base_time VARCHAR(4), machine_desc VARCHAR(100),
   machine_center_name VARCHAR(30), sorting_mode VARCHAR(1) 일반:N/체결:C, 
   multi_yn VARCHAR(1) 멀티바코드 사용여부)
- tb_model_group_mt: 모듈 Group 정의 Master
- tb_model_module_mt: 모듈 정의 Master
- tb_model_machine_dt: 구분기 모델 정의 상세
- tb_model_pc_mt: PC 모델 정의

2) 운영 테이블:
- tb_oper_machine_state_ht: 장비 각 모듈의 상태 이력
- tb_oper_sorting_plan_mt: 구분계획 정의 Master
- tb_oper_sorting_plan_dt: 구분계획 설정값 상세
- tb_oper_sorting_plan_ht: 구분계획 변동 이력
- tb_oper_sorting_plan_config_dt: 구분계획 운영 설정 상세
- tb_oper_chute_management_dt: 슈트현황판 행선지 내용
- tb_oper_entrust_size_mt: 위탁 크기 정의 Master
- tb_group_code_mt: 그룹코드 정의
- tb_sort_code_mt: 구분코드 정의
- tb_office_code_mt: 우체국코드 정의
- tb_oper_special_key_mt: 구분계획 특수키 Master
- tb_oper_special_key_dt: 구분계획 특수키 상세

3) CGS 테이블:
- tb_hmi_alarm_mt: HMI(CGS) Alarm 정의 Master
- tb_hmi_alarm_ht: HMI(CGS) Alarm 이력

4) 소포 테이블:
- tb_item_parcel_dt: 소포정보 상세

5) 통계 테이블:
- tb_stat_summary_statistics: 요약 통계정보
- tb_stat_induction_statistics: Induction별 통계
- tb_stat_chute_statistics: Chute별 통계
- tb_stat_code_statistics: 우편번호 코드별 통계
- tb_stat_sorter_statistics: 구분기 통계

6) 접수정보 테이블:
- tb_sim_regi_info: 접수정보 연계

[SIMS 연계 통계 DB - psm_reginfo 스키마]
- psm_statistics: 송신용 전체 통계
- psm_induction_statistics: 송신용 공급부 통계
- psm_chute_statistics: 송신용 구분구 통계
- psm_post_amount: 송신용 우편번호 통계
- psm_request: 송신용 완료 확인
- psm_reg_post_result: 구분정보 연계
- poem_t0050: 설비상태정보

[데이터 생명주기 스케줄러]
다음 스케줄러를 구현해:
- BATCH_REPORT (매일 10분마다):
  - Local 전체 통계, Local 인덕션별 통계, Local 구분구별 통계
  - Local 코드별 통계, Local 구분기별 통계 (매 10분)
  - SIMS 전체 통계, SIMS 구분구별 통계
  - SIMS 코드별 통계, SIMS 구분기별 통계 (매 30분)
- BATCH_DELETE (매일 오후 12시 15분):
  - Local 통계(전체): 60일 이전 데이터 삭제
  - 걸업이력: 60일 이전
  - 구분 데이터: 60일 이전
  - SIMS 통계(전체): 3일 이전
  - 접수정보: 7일 이전
  - 체결/구분 정보: 14일 이전
- 백업: 매주 일요일 오전 11시 30분

Prisma 스키마, 마이그레이션, seed 데이터, 그리고 
Bull 기반의 스케줄러 서비스를 구현해줘.
```
