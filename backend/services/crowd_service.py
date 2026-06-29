from schemas import CrowdLevel


def get_crowd_level(passenger_count: int) -> CrowdLevel:
    """
    Classify bus crowding based on active passenger count.

    LOW      : 1–3  passengers
    MODERATE : 4–8  passengers
    HIGH     : 9+   passengers
    """
    if passenger_count <= 3:
        return CrowdLevel.LOW
    elif passenger_count <= 8:
        return CrowdLevel.MODERATE
    else:
        return CrowdLevel.HIGH
